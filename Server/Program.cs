using System.Net.WebSockets;
using System.Text;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var rooms = new Dictionary<string, List<WebSocket>>();
var connections = new Dictionary<string, WebSocket>();

app.UseWebSockets();

app.Map("/ws", async context =>
{
    if (!context.WebSockets.IsWebSocketRequest)
    {
        context.Response.StatusCode = 400;
        return;
    }

    var socket = await context.WebSockets.AcceptWebSocketAsync();
    var connectionId = Guid.NewGuid().ToString();
    connections.Add(connectionId, socket);

    var buffer = new byte[1024];
    
    while (socket.State == WebSocketState.Open)
    {
        var result = await socket.ReceiveAsync(buffer, CancellationToken.None);
        
        if (result.MessageType == WebSocketMessageType.Close) break;
        
        var msg = Encoding.UTF8.GetString(buffer, 0, result.Count);
        
        Console.WriteLine($@"Received {msg}");
        
        // Message handler

        if (msg == "create_room")
        {
            var random = new Random();
            var roomCode = random.Next(0, 10000).ToString("D4");
            rooms.Add(roomCode, [socket]);
            
            if (!connections.TryGetValue(connectionId, out var socketFound))
                return;

            if (socketFound.State != WebSocketState.Open)
                return;

            var bytes = Encoding.UTF8.GetBytes($@"Joined room {roomCode}");

            await socketFound.SendAsync(
                bytes,
                WebSocketMessageType.Text,
                true,
                CancellationToken.None
            );
        }

        if (msg == "join_room")
        {
            
        }
    }
});

app.Run();