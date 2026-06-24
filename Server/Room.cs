namespace Server;

public class Room
{
    public readonly string Id;
    Connection? _connectionFirst;
    Connection? _connectionSecond;
    
    public Room(Connection connection, Dictionary<string, Room> rooms)
    {
        do
        {
            Id = new Random().Next(0, 10000).ToString("D4");
        } while (rooms.ContainsKey(Id));

        _connectionFirst = connection;
    }

    public bool Connect(Connection connection)
    {
        if (_connectionFirst == null && ReferenceEquals(connection, _connectionSecond)) 
            _connectionFirst = connection;
        else if (_connectionSecond == null && ReferenceEquals(connection, _connectionFirst)) 
            _connectionSecond = connection;
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