using System.Text;
using static Server.Utils;

namespace Server;


public class Room
{
    public readonly string Id;
    Connection? _connectionFirst;
    Connection? _connectionSecond;
    bool _isSelfDestructTriggered;

    string _firstClientId;
    string _secondClientId;

    State _state = new();
    MoveMessageOut? _lastMove;
    
    readonly ILogger<Room> _logger =  Log.For<Room>();
    
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
        await SocketSendAsync(conn, CreateOutMsg("snap", ref snap));
    }

    public async Task SendPlayerJoined(Connection conn)
    {
        var connTarget = GetOtherConnection(conn);
        if (connTarget is null) return;
        await SocketSendAsync(conn, CreateOutMsg("op_joined", ""));
    }

    public async Task SendPlayerDisconnected()
    {
        var connTarget = _connectionFirst ?? _connectionSecond;
        if (connTarget is not null) await SocketSendAsync(connTarget, CreateOutMsg("op_left", ""));
    }

    public async Task HandleMessage(Connection conn, string json)
    {
        try
        {
            if (!TryParseJson(json, out var root, out var type))
            {
                await SocketSendAsync(conn, "Unknown message"u8.ToArray());
                _logger.LogInformation("Invalid json");
                return;
            }

            if (type == "get_snap")
            {
                await SendSnapshot(conn);
                return;
            }

            if (!Validation.IsPlayerTurn(conn, ref _state.GameState))
            {
                if (type == "stop")
                {
                    if (_state.GameState.IsStop || _lastMove is null) {
                        await SocketSendAsync(conn, CreateOutMsg("stop_failed", "can't stop"));
                        return;
                    }
                    _state.SetStop(true);
                    var otherConn = GetOtherConnection(conn);
                    await SocketSendAsync(otherConn, CreateOutMsg("stop", ""));
                    return;
                }

                if (type == "stop_end")
                {
                    _state.SetStop(false);
                    var otherConn = GetOtherConnection(conn);
                    await SocketSendAsync(otherConn, CreateOutMsg("stop_end", ""));
                    return;
                }
                
                _logger.LogInformation("Not player turn");
                await SocketSendAsync(conn, CreateOutMsg("wrong_turn", ""));
                return;
            }

            switch (type)
            {
                case "move":
                {
                    if (!TryDeserializeRoot<MoveMessage>(root, out var move))
                    {
                        _logger.LogInformation("Invalid Move JSON");
                        break;
                    }

                    if (move is null) break;
                    if (conn.TurnId == 1) ChangeMovePov(ref move); // To player pov, if sent by opponent
                    // _logger.LogInformation(move);
                    
                    if (!Validation.IsValidMove(move, ref _state.GameState, conn.TurnId == 0))
                    {
                        _logger.LogInformation("Invalid move");
                        await SocketSendAsync(conn, CreateOutMsg("move_failed", "Invalid move"));
                        break;
                    }
                    
                    _state.MoveCard(move);
                    _lastMove = move;
                    
                    var otherConn = GetOtherConnection(conn);
                    var moveOut = new MoveMessageOut{ Type=move.Type, Target = move.Target, Src = move.Src };
                    
                    await SocketSendAsync(otherConn, CreateOutMsg("move", moveOut));

                    if (move.Src.EndsWith("reserve")) // is player reserve
                    {
                        var card = _state.DrawReserveCard(conn.TurnId);
                        if (card is null) break;
                        
                        await SocketSendAsync(otherConn, CreateOutMsg("draw_reserve_op", card.Value.Name));
                        await SocketSendAsync(conn, CreateOutMsg("draw_reserve", card.Value.Name));
                    }
                    
                    if (move.Src.EndsWith("pile")) // is player pile
                    {
                        _state.SetCardDrawn(false);
                        
                        var card = _state.GetPlayerPileCard(conn.TurnId);
                        if (card is null) break;
                        
                        await SocketSendAsync(otherConn, CreateOutMsg("draw_pile_op", card.Value.Name));
                        await SocketSendAsync(conn, CreateOutMsg("draw_pile", card.Value.Name));
                    }
                    
                    break;
                }
                
                case "draw_card":
                {
                    if (Validation.IsValidDrawCard(ref _state.GameState))
                    {
                        await SocketSendAsync(conn, CreateOutMsg("draw_card_failed", "Already drew"));
                        break;                        
                    }
                    
                    var card = _state.DrawCard(conn.TurnId);
                    if (card is null)
                    {
                        await SocketSendAsync(conn, CreateOutMsg("draw_card_failed", "Deck empty"));
                        break;
                    }

                    var nextDeckCardOwner = _state.GetDeckCardOwner(conn.TurnId);
                    var otherConn = GetOtherConnection(conn);
                    
                    _state.SetCardDrawn(true);

                    await SocketSendAsync(conn, CreateOutMsg("draw_card", $@"{card.Value.Name},{nextDeckCardOwner}"));
                    await SocketSendAsync(otherConn, CreateOutMsg("draw_card_op", $@"{card.Value.Name},{nextDeckCardOwner}"));
                    break;
                }

                case "end_turn":
                {
                    if (!Validation.IsValidTurnEnd(conn, ref _state.GameState))
                    {
                        await SocketSendAsync(conn, CreateOutMsg("end_turn_failed", "Must draw card"));
                        break;
                    }
                    _state.ChangeTurn();
                    var otherConn = GetOtherConnection(conn);
                    await SocketSendAsync(otherConn, CreateOutMsg("end_turn_op", ""));
                    break;
                }
                
                case "stop_end":
                {
                    if (!_state.GameState.IsStop)
                    {
                        await SocketSendAsync(conn, CreateOutMsg("stop_end_failed", "not stopped"));
                        break;
                    }
                    
                    var otherConn = GetOtherConnection(conn);
                    
                    _state.SetStop(false);
                    await SocketSendAsync(otherConn, CreateOutMsg("stop_end", ""));
                    break;
                }

                case "stop_accept":
                {
                    if (!_state.GameState.IsStop || _lastMove is null)
                    {
                        await SocketSendAsync(conn, CreateOutMsg("stop_accept_failed", "invalid action"));
                        break;
                    }

                    var connectionP1 = conn.TurnId == 0 ? conn : GetOtherConnection(conn);
                    var connectionP2 = conn.TurnId == 1 ? conn : GetOtherConnection(conn);
                    
                    var undoMoveP1 = new MoveUndoMessageOut
                    {
                        Type =_lastMove.Type, 
                        Src = _lastMove.Target, 
                        Target = _lastMove.Src,
                        TurnId = _state.GameState.TurnPlayerId
                    };
                    
                    var undoMoveP2 = new MoveUndoMessageOut
                    {
                        Type =_lastMove.Type, 
                        Src = _lastMove.Target, 
                        Target = _lastMove.Src, 
                        TurnId = _state.GameState.TurnPlayerId
                    };
                    
                    ChangeMovePov(ref undoMoveP2);

                    _state.SetStop(false);
                    _state.MoveCard(undoMoveP1);
                    _state.ChangeTurn();
                    _lastMove = null;

                    if (!undoMoveP1.Src.StartsWith("pile"))
                    {
                        var srcList = State.GetList(undoMoveP1.Src, ref _state.GameState)!;
                        if (srcList.Count != 0)
                        {
                            var card = srcList.Last();
                            undoMoveP1.SrcRepl = card.Name;
                            undoMoveP2.SrcRepl = card.Name;
                        }
                    }

                    var _ = SocketSendAsync(connectionP1, CreateOutMsg("stop_accept", undoMoveP1));
                    var __ = SocketSendAsync(connectionP2, CreateOutMsg("stop_accept", undoMoveP2));
                    break;
                }
            }
        }
        catch (Exception e)
        {
            _logger.LogInformation("\nRoom HandleMessage failed: " + e);
        }
    }
    
    void ChangeMovePov(ref MoveUndoMessageOut move)
    {
        if (move.Src.StartsWith("player")) move.Src = move.Src.Replace("player", "opponent");
        else if (move.Src.StartsWith("opponent")) move.Src = move.Src.Replace("opponent", "player");
                        
        if (move.Target.StartsWith("player")) move.Target = move.Target.Replace("player", "opponent");
        else if (move.Target.StartsWith("opponent")) move.Target = move.Target.Replace("opponent", "player");
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
        if (_firstClientId == connection.ClientSideId)
        {
            _connectionFirst = connection;
            _connectionFirst.TurnId = 0;
        }
        else if (_secondClientId == connection.ClientSideId)
        {
            _connectionSecond = connection;
            _connectionSecond.TurnId = 1;
        }
        else if (_connectionFirst == null && !ReferenceEquals(connection, _connectionSecond))
        {
            _connectionFirst = connection;
            _connectionFirst.TurnId = 0;
            _firstClientId = connection.ClientSideId;
        }
        else if (_connectionSecond == null && !ReferenceEquals(connection, _connectionFirst))
        {
            _connectionSecond = connection;
            _connectionSecond.TurnId = 1;
            _secondClientId = connection.ClientSideId;
        }
        else
        {
            await SocketSendAsync(connection, CreateOutMsg("join_room_failed", "Full"));
            return false;
        }

        var joinedRoom = new JoinedRoom{ Id = Id, PlayerId = connection.TurnId, OpponentIn = Count - 1};
        await SocketSendAsync(connection, CreateOutMsg("joined_room", joinedRoom));
        
        // Later to Start event
        var snap = _state.GetSnapshot(connection.TurnId);
        await SocketSendAsync(connection, CreateOutMsg("start", ref snap));
        
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