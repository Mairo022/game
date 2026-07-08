using static Server.Utils;

namespace Server;


public class Room
{
    public readonly string Id;
    Connection? _connectionFirst;
    Connection? _connectionSecond;

    State _state = new();
    
    public Room(Dictionary<string, Room> rooms)
    {
        do Id = new Random().Next(0, 10000).ToString("D4");
        while (rooms.ContainsKey(Id));
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
        await SocketSendAsync(conn.Socket, CreateOutMsg("snap", ref snap));
    }

    public async Task HandleMessage(Connection conn, string json)
    {
        try
        {
            Console.WriteLine(json);
            
            if (!TryParseJson(json, out var root, out var type))
            {
                await SocketSendAsync(conn.Socket, "Unknown message");
                Console.WriteLine("Invalid json");
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

                    // Swap player pov to server pov
                    if (conn.TurnId == 1)
                    {
                        if (move.Src.StartsWith("player")) move.Src = move.Src.Replace("player", "opponent");
                        else if (move.Src.StartsWith("opponent")) move.Src = move.Src.Replace("opponent", "player");
                        
                        if (move.Target.StartsWith("player")) move.Target = move.Target.Replace("player", "opponent");
                        else if (move.Target.StartsWith("opponent")) move.Target = move.Target.Replace("opponent", "player");
                    }
                    Console.WriteLine(move);
                    
                    var isValid = Validation.IsValidMove(move, ref _state.GameState);
                    Console.WriteLine(isValid ? "Valid move" : "Invalid move");
                    
                    if (!isValid)
                    {
                        await SocketSendAsync(conn.Socket, CreateOutMsg("move_failed", "Invalid move"));
                        break;
                    }
                    
                    _state.MoveCard(move);
                    
                    var otherConn = GetOtherConnection(conn);
                    var moveOut = new MoveMessageOut{ Type=move.Type, Target = move.Target, Src = move.Src };
                    
                    await SocketSendAsync(otherConn?.Socket, CreateOutMsg("move", moveOut));

                    if (move.Src.EndsWith("reserve"))
                    {
                        var card = _state.DrawReserveCard(conn.TurnId);
                        if (card is null) break;
                        
                        await SocketSendAsync(otherConn?.Socket, CreateOutMsg("draw_reserve_op", card.Value.Name));
                        await SocketSendAsync(conn.Socket, CreateOutMsg("draw_reserve", card.Value.Name));
                    }
                    break;
                }
                case "draw_card":
                {
                    var otherConn = GetOtherConnection(conn);
                    
                    // if (conn.TurnId != _state.GameState.Turn)
                    // {
                    //     await SocketSendAsync(conn.Socket, CreateOutMsg("draw_card_failed", "Wrong turn"));
                    //     break;
                    // }

                    var card = _state.DrawCard(conn.TurnId);
                    if (card is null)
                    {
                        await SocketSendAsync(conn.Socket, CreateOutMsg("draw_card_failed", "Deck empty"));
                        break;
                    }
                    
                    await SocketSendAsync(conn.Socket, CreateOutMsg("draw_card", card.Value.Name));
                    await SocketSendAsync(otherConn?.Socket, CreateOutMsg("draw_card_op", card.Value.Name));
                    break;
                }
                case "get_snap":
                {
                    await SendSnapshot(conn);
                    break;
                }
            }
        }
        catch (Exception e)
        {
            Console.WriteLine("\nRoom HandleMessage failed: " + e);
        }
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
            await SocketSendAsync(connection.Socket, CreateOutMsg("join_room_failed", "Full"));
            return false;
        }
        
        await SocketSendAsync(connection.Socket, CreateOutMsg("joined_room", Id));
        
        // Later to Start event
        var snap = _state.GetSnapshot(connection.TurnId);
        await SocketSendAsync(connection.Socket, CreateOutMsg("start", ref snap));
        
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