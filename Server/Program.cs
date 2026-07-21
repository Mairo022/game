using static Server.Utils;
using static Server.Heartbeat;
using System.Net.WebSockets;
using System.Text;
using Server;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://127.0.0.1:5005");
var app = builder.Build();

var connections = new Dictionary<string, Connection>();
var rooms = new Dictionary<string, Room>();

app.UseWebSockets();
_ = Task.Run(() => HeartbeatLoop(connections, TimeSpan.FromSeconds(15)));

app.Map("/ws", async context =>
{
    if (!context.WebSockets.IsWebSocketRequest)
    {
        context.Response.StatusCode = 400;
        return;
    }

    var socket = await context.WebSockets.AcceptWebSocketAsync();
    var connection = new Connection(socket);
    Room? room = null;
    var buffer = new byte[128];
    
    connections.Add(connection.Id, connection);
    
    while (socket.State == WebSocketState.Open)
    {
        var result = await socket.ReceiveAsync(buffer, CancellationToken.None);
        
        if (!result.EndOfMessage)
        {
            await socket.CloseAsync(
                WebSocketCloseStatus.MessageTooBig,
                "Msg too large",
                CancellationToken.None);
            return;
        }
        
        if (result.MessageType == WebSocketMessageType.Close)
        {
            Console.WriteLine("Connection lost");
            connection.DisconnectFromRoom();
            connections.Remove(connection.Id);
            if (room?.Count == 0) rooms.Remove(room.Id);
            return;
        }
        
        var msg = Encoding.UTF8.GetString(buffer, 0, result.Count);
        
        if (msg.Equals("pong"))
        {
            connection.LastSeen = DateTime.Now;
            continue;
        }
        
        Console.WriteLine($@"Received {msg}");
        
        if (msg.Equals("create_room"))
        {
            // Note: Auto connect to available room
            // room = rooms.Values.FirstOrDefault();
            // if (room is not null)
            // {
            //     if (await room.Connect(connection))
            //     {
            //         connection.Room = room;
            //         continue;
            //     }
            // }
            connection.DisconnectFromRoom();
            if (room?.Count == 0) rooms.Remove(room.Id);

            room = new Room(rooms);
            await room.Connect(connection);
            connection.Room = room;
        }
        else if (msg.StartsWith("join_room:"))
        {
            var roomCode = msg.Split(':')[1][..4];

            if (!rooms.TryGetValue(roomCode, out room))
            {
                await SocketSendAsync(socket, CreateOutMsg("join_room_failed", "Not Found"));
                continue;
            }

            connection.Room = await room.Connect(connection) ? room : null;
        }
        else
        {
            room?.HandleMessage(connection, msg);
        }
    }
});

app.Run();