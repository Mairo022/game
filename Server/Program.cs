using static Server.Utils;
using System.Net.WebSockets;
using System.Text;
using Server;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var connections = new Dictionary<string, Connection>();
var rooms = new Dictionary<string, Room>();

app.UseWebSockets();

app.Map("/ws", async context =>
{
    if (!context.WebSockets.IsWebSocketRequest)
    {
        context.Response.StatusCode = 400;
        return;
    }

    var socket = await context.WebSockets.AcceptWebSocketAsync();
    
    var connection = new Connection(socket);
    connections.Add(connection.Id, connection);

    Room? room = null;
    var buffer = new byte[32];
    
    while (socket.State == WebSocketState.Open)
    {
        var result = await socket.ReceiveAsync(buffer, CancellationToken.None);
        
        if (!result.EndOfMessage) await socket.CloseAsync(
            WebSocketCloseStatus.MessageTooBig,
            "Msg too large",
            CancellationToken.None);
        
        if (result.MessageType == WebSocketMessageType.Close)
        {
            connection.DisconnectFromRoom();
            connections.Remove(connection.Id);
            if (room?.Count == 0) rooms.Remove(room.Id);
            break;
        }
        
        var msg = Encoding.UTF8.GetString(buffer, 0, result.Count);
        Console.WriteLine($@"Received {msg}");

        if (msg.StartsWith("create_room"))
        { 
            connection.DisconnectFromRoom();
            if (room?.Count == 0) rooms.Remove(room.Id);

            room = new Room(connection, rooms);
            rooms.Add(room.Id, room);
            connection.Room = room;

            await SocketSendAsync(socket, $@"joined_room:{room.Id}");
            await room.SendSnapshot();
        }
        else if (msg.StartsWith("join_room"))
        {
            var split = msg.Split(':');
            var roomCode = split[1];

            if (!rooms.TryGetValue(roomCode, out room))
            {
                Console.WriteLine($"Room {roomCode} not found");
                await SocketSendAsync(socket, $@"not_found:{roomCode}");
                continue;
            }
                
            room.Connect(connection);
            connection.Room = room;
            await SocketSendAsync(socket, $@"joined_room:{roomCode}");
            await room.SendSnapshot();
        }
        else
        {
            room?.HandleMessage(connection, msg);
        }
    }
});

app.Run();