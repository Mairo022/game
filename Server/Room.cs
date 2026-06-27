using static Server.Utils;
using System.Text.Json;

namespace Server;


public class Room
{
    public readonly string Id;
    Connection? _connectionFirst;
    Connection? _connectionSecond;

    State _state = new();
    
    public Room(Connection connection, Dictionary<string, Room> rooms)
    {
        do
        {
            Id = new Random().Next(0, 10000).ToString("D4");
        } while (rooms.ContainsKey(Id));

        _connectionFirst = connection;
        _connectionFirst.TurnId = 0;
    }

    public async Task SendSnapshot()
    {
        if (_connectionFirst is not null)
            await SocketSendAsync(_connectionFirst.Socket, JsonSerializer.Serialize(_state.GetSnapshot(0)));
        if (_connectionSecond is not null)
            await SocketSendAsync(_connectionSecond.Socket, JsonSerializer.Serialize(_state.GetSnapshot(1)));
    }

    public void HandleMessage(Connection connection, string msg)
    {
        if ("draw_card" == msg)
        {
            
        }
    }

    public bool Connect(Connection connection)
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
        else return false;
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