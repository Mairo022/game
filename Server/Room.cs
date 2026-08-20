using static Server.Utils;

namespace Server;


public class Room
{
    public readonly string Id;
    Connection? _connectionFirst;
    Connection? _connectionSecond;
    bool _isSelfDestructTriggered;

    State _state = new();
    
    public Room(Dictionary<string, Room> rooms)
    {
        do Id = GenerateString(4);
        while (rooms.ContainsKey(Id));
        
        rooms.Add(Id, this);
    }

    public async Task TriggerSelfDestruct(Dictionary<string, Room> rooms)
    {
        if (_isSelfDestructTriggered) return;
        _isSelfDestructTriggered = true;
        
        await Task.Delay(TimeSpan.FromSeconds(120));
        if (Count != 0) return;
        rooms.Remove(Id);
    }

    async Task SendSnapshots()
    {
        if (_connectionFirst is not null)
            await SendSnapshot(_connectionFirst);
        if (_connectionSecond is not null)
            await SendSnapshot(_connectionSecond);
    }

    async Task SendSnapshot(Connection conn)
    {
        var snap = _state.GetSnapshot(conn.TurnId);
        await SocketSendAsync(conn.Socket, CreateOutMsg("snap", ref snap), conn.Cts.Token);
    }

    public async Task SendPlayerJoined(Connection conn)
    {
        var connTarget = GetOtherConnection(conn);
        if (connTarget is null) return;
        await SocketSendAsync(connTarget.Socket, CreateOutMsg("op_joined", ""), conn.Cts.Token);
    }

    public async Task SendPlayerDisconnected()
    {
        var connTarget = _connectionFirst ?? _connectionSecond;
        if (connTarget is not null) await SocketSendAsync(connTarget.Socket, CreateOutMsg("op_left", ""), connTarget.Cts.Token);
    }

    public async Task HandleMessage(Connection conn, string json)
    {
        try
        {
            if (!TryParseJson(json, out var root, out var type))
            {
                await SocketSendAsync(conn.Socket, "Unknown message", conn.Cts.Token);
                Console.WriteLine("Invalid json");
                return;
            }

            if (type == "get_snap")
            {
                await SendSnapshot(conn);
                return;
            }

            if (!Validation.IsPlayerTurn(conn, ref _state.GameState))
            {
                Console.WriteLine("Not player turn");
                await SocketSendAsync(conn.Socket, CreateOutMsg("wrong_turn", ""), conn.Cts.Token);
                return;
            }

            switch (type)
            {
                case "move":
                {
                    if (!TryDeserializeRoot<MoveMessage>(root, out var move))
                    {
                        Console.WriteLine("Invalid Move JSON");
                        break;
                    }

                    if (move is null) break;
                    if (conn.TurnId == 1) ChangeMovePov(ref move);
                    // Console.WriteLine(move);
                    
                    if (!Validation.IsValidMove(move, ref _state.GameState, conn.TurnId == 0))
                    {
                        Console.WriteLine("Invalid move");
                        await SocketSendAsync(conn.Socket, CreateOutMsg("move_failed", "Invalid move"), conn.Cts.Token);
                        break;
                    }
                    
                    _state.MoveCard(move);
                    
                    var otherConn = GetOtherConnection(conn);
                    var moveOut = new MoveMessageOut{ Type=move.Type, Target = move.Target, Src = move.Src };
                    
                    await SocketSendAsync(otherConn?.Socket, CreateOutMsg("move", moveOut), conn.Cts.Token);

                    if (move.Src.EndsWith("reserve")) // is player reserve
                    {
                        var card = _state.DrawReserveCard(conn.TurnId);
                        if (card is null) break;
                        
                        await SocketSendAsync(otherConn?.Socket, CreateOutMsg("draw_reserve_op", card.Value.Name), conn.Cts.Token);
                        await SocketSendAsync(conn.Socket, CreateOutMsg("draw_reserve", card.Value.Name), conn.Cts.Token);
                    }
                    
                    if (move.Src.EndsWith("pile")) // is player pile
                    {
                        _state.SetCardDrawn(false);
                        
                        var card = _state.GetPlayerPileCard(conn.TurnId);
                        if (card is null) break;
                        
                        await SocketSendAsync(otherConn?.Socket, CreateOutMsg("draw_pile_op", card.Value.Name), conn.Cts.Token);
                        await SocketSendAsync(conn.Socket, CreateOutMsg("draw_pile", card.Value.Name), conn.Cts.Token);
                    }
                    
                    break;
                }
                
                case "draw_card":
                {
                    if (Validation.IsValidDrawCard(ref _state.GameState))
                    {
                        await SocketSendAsync(conn.Socket, CreateOutMsg("draw_card_failed", "Already drew"), conn.Cts.Token);
                        break;                        
                    }
                    
                    var card = _state.DrawCard(conn.TurnId);
                    if (card is null)
                    {
                        await SocketSendAsync(conn.Socket, CreateOutMsg("draw_card_failed", "Deck empty"), conn.Cts.Token);
                        break;
                    }

                    var nextDeckCardOwner = _state.GetDeckCardOwner(conn.TurnId);
                    var otherConn = GetOtherConnection(conn);
                    
                    _state.SetCardDrawn(true);

                    await SocketSendAsync(conn.Socket, CreateOutMsg("draw_card", $@"{card.Value.Name},{nextDeckCardOwner}"), conn.Cts.Token);
                    await SocketSendAsync(otherConn?.Socket, CreateOutMsg("draw_card_op", $@"{card.Value.Name},{nextDeckCardOwner}"), conn.Cts.Token);
                    break;
                }

                case "end_turn":
                {
                    if (!Validation.IsValidTurnEnd(conn, ref _state.GameState))
                    {
                        await SocketSendAsync(conn.Socket, CreateOutMsg("end_turn_failed", "Must draw card"), conn.Cts.Token);
                        break;
                    }
                    _state.ChangeTurn();
                    var otherConn = GetOtherConnection(conn);
                    await SocketSendAsync(otherConn?.Socket, CreateOutMsg("end_turn_op", ""), conn.Cts.Token);
                    break;
                }
            }
        }
        catch (Exception e)
        {
            Console.WriteLine("\nRoom HandleMessage failed: " + e);
        }
    }

    void ChangeMovePov(ref MoveMessage move)
    {
        if (move.Src.StartsWith("player")) move.Src = move.Src.Replace("player", "opponent");
        else if (move.Src.StartsWith("opponent")) move.Src = move.Src.Replace("opponent", "player");
                        
        if (move.Target.StartsWith("player")) move.Target = move.Target.Replace("player", "opponent");
        else if (move.Target.StartsWith("opponent")) move.Target = move.Target.Replace("opponent", "player");
    }

    Connection? GetOtherConnection(Connection conn)
    {
        return ReferenceEquals(conn, _connectionFirst) ? _connectionSecond : _connectionFirst;
    }

    public async Task<bool> Connect(Connection connection)
    {
        if (_connectionFirst == null && !ReferenceEquals(connection, _connectionSecond))
        {
            _connectionFirst = connection;
            _connectionFirst.TurnId = 0;
        }
        else if (_connectionSecond == null && !ReferenceEquals(connection, _connectionFirst))
        {
            _connectionSecond = connection;
            _connectionSecond.TurnId = 1;
        }
        else
        {
            await SocketSendAsync(connection.Socket, CreateOutMsg("join_room_failed", "Full"), connection.Cts.Token);
            return false;
        }

        var joinedRoom = new JoinedRoom{ Id = Id, PlayerId = connection.TurnId, OpponentIn = Count - 1};
        await SocketSendAsync(connection.Socket, CreateOutMsg("joined_room", joinedRoom), connection.Cts.Token);
        
        // Later to Start event
        var snap = _state.GetSnapshot(connection.TurnId);
        await SocketSendAsync(connection.Socket, CreateOutMsg("start", ref snap), connection.Cts.Token);
        
        return true;
    }

    public bool Disconnect(Connection connection)
    {
        if (ReferenceEquals(connection, _connectionFirst)) _connectionFirst = null;
        else if (ReferenceEquals(connection, _connectionSecond)) _connectionSecond = null;
        else return false;
        return true;
    }
    
    public int Count =>
        (_connectionFirst is not null ? 1 : 0) +
        (_connectionSecond is not null ? 1 : 0);
}

public record JoinedRoom
{
    public required string Id { get; init; }
    public required int PlayerId { get; init; }
    public required int OpponentIn { get; init; }
}