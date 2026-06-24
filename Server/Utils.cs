using System.Net.WebSockets;
using System.Text;

namespace Server;

public static class Utils
{
    public static async Task SocketSendAsync(WebSocket socket, string message)
    {
        await socket.SendAsync(
            Encoding.UTF8.GetBytes(message),
            WebSocketMessageType.Text,
            true,
            CancellationToken.None
        );
    }
}