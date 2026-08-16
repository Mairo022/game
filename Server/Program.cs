using static Server.Heartbeat;
using System.Net.WebSockets;
using System.Text;
using Server;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://127.0.0.1:5005");
var app = builder.Build();

var connections = new Dictionary<string, Connection>();
var roomsHandler = new RoomsHandler();

app.UseWebSockets();
_ = Task.Run(() => HeartbeatLoop(connections, TimeSpan.FromSeconds(15)));

app.Map("/ws", async context =>
{
    // Console.WriteLine($"Rooms count: {roomsHandler.RoomsCount}");
    var socket = await context.WebSockets.AcceptWebSocketAsync();
    var connection = new Connection(socket);
    Room? room = null;
    var buffer = new byte[128];
    
    try
    {
        if (!context.WebSockets.IsWebSocketRequest)
        {
            context.Response.StatusCode = 400;
            return;
        }

        connections.Add(connection.Id, connection);

        while (WebSocketState.Open == socket.State)
        {
            var result = await socket.ReceiveAsync(buffer, CancellationToken.None);
            
            if (WebSocketMessageType.Close == result.MessageType)
            {
                roomsHandler.OnDisconnect(connection, room);
                connections.Remove(connection.Id);
                return;
            }

            if (!result.EndOfMessage)
            {
                await socket.CloseAsync(
                    WebSocketCloseStatus.MessageTooBig,
                    "Msg too large",
                    CancellationToken.None);

                roomsHandler.OnDisconnect(connection, room);
                connections.Remove(connection.Id);
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
                
                room = await roomsHandler.OnCreateRoom(connection, room);
                connection.Room = room;
                continue;
            }
            
            if (msg.StartsWith("join_room:"))
            {
                var joinRoomId = msg.Split(':')[1];
                var roomJoined = await roomsHandler.OnJoinRoom(connection, room, socket, joinRoomId);
                if (roomJoined is not null)
                {
                    room = roomJoined;
                    connection.Room = room;
                }
                continue;
            }

            room?.HandleMessage(connection, msg);
        }
    } 
    catch (Exception e)
    {
        Console.BackgroundColor = ConsoleColor.DarkRed;
        Console.Error.WriteLine($"[ERROR] Main loop failed:\n   {e}");
        Console.Error.WriteLine("Last message: " + Encoding.UTF8.GetString(buffer, 0, 128));
        Console.ResetColor();
        
        roomsHandler.OnDisconnect(connection, room);
        connections.Remove(connection.Id);
        socket.Abort();
        socket.Dispose();
    }
});

app.Run();