using System.Net.WebSockets;

namespace Server;

public class Connection(WebSocket socket)
{
    public readonly string Id = Guid.NewGuid().ToString();
    public readonly WebSocket Socket = socket;
    public int TurnId;
    public Room? Room;
    public DateTime LastSeen = DateTime.Now;

    public void DisconnectFromRoom()
    {
        if (Room == null) return;
        Room.Disconnect(this);
        Room = null;
    }
}