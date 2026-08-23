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
    var socket = await context.WebSockets.AcceptWebSocketAsync();
    
    var clientSideId = context.Request.Query["myId"].FirstOrDefault();
    if (clientSideId is null || !clientSideId.All(char.IsAsciiLetterOrDigit) || clientSideId.Length != 4)
    {
        socket.CloseAsync(
            WebSocketCloseStatus.PolicyViolation,
            "Identity issues",
            CancellationToken.None);

        await Task.Delay(500);
        socket.Abort();
        socket.Dispose();
        return;
    }
    
    var connection = new Connection(socket, clientSideId);
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
            var result = await socket.ReceiveAsync(buffer, connection.Cts.Token);

            if (WebSocketMessageType.Close == result.MessageType)
            {
                Console.WriteLine("Lost connection");
                return;
            }

            if (!result.EndOfMessage)
            {
                await socket.CloseAsync(
                    WebSocketCloseStatus.MessageTooBig,
                    "Msg too large",
                    connection.Cts.Token);
                break;
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

        Console.WriteLine($"Closed: {connection.Id}");
    }
    catch (WebSocketException)
    {
        Console.WriteLine($"Socket disconnected, lost connection with {connection.Id}");
    }
    catch (OperationCanceledException)
    {
        Console.WriteLine($"Operation canceled, lost connection with {connection.Id}");
    }
    catch (Exception e)
    {
        Console.BackgroundColor = ConsoleColor.DarkRed;
        Console.Error.WriteLine($"[ERROR] Main loop failed:\n   {e}");
        Console.Error.WriteLine("Last message: " + Encoding.UTF8.GetString(buffer, 0, 128));
        Console.ResetColor();
    }
    finally
    {
        roomsHandler.OnDisconnect(connection, room);
        connections.Remove(connection.Id);
        connection.Cts.Dispose();
        socket.Abort();
        socket.Dispose();
    }
});

app.Run();