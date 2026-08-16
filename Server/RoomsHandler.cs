using System.Net.WebSockets;

namespace Server;

using static Utils;

public class RoomsHandler
{
    Dictionary<string, Room> _rooms = new();

    public void OnDisconnect(Connection connection, Room? room)
    {
        Console.WriteLine($"{connection.Id} has disconnected");
        connection.DisconnectFromRoom();
        if (room?.Count == 0) _ = room.TriggerSelfDestruct(_rooms);
    }

    public async Task<Room?> OnCreateRoom(Connection connection, Room? room)
    {
        connection.DisconnectFromRoom();
        if (room?.Count == 0) _ = room.TriggerSelfDestruct(_rooms);
        
        room = new Room(_rooms);
        return await room.Connect(connection) ? room : null;
    }

    public async Task<Room?> OnJoinRoom(Connection connection, Room? room, WebSocket socket, string joinRoomId)
    {
        if (joinRoomId.Length != 4 || !_rooms.TryGetValue(joinRoomId, out var roomFound))
        {
            await SocketSendAsync(socket, CreateOutMsg("join_room_failed", "Not Found"));
            return null;
        }
        
        if (await roomFound.Connect(connection))
        {
            _ = roomFound.SendPlayerJoined(connection);
            connection.DisconnectFromRoom();
            if (room?.Count == 0) _ = room.TriggerSelfDestruct(_rooms);
            return roomFound;
        }

        return null;
    }
    
    public int RoomsCount => _rooms.Count;
}