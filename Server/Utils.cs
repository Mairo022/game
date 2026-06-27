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
    
    private static readonly Random Rng = new();

    public static void Shuffle<T>(IList<T> arr)
    {
        int i = arr.Count;
        int j;

        while (--i > 0)
        {
            j = Rng.Next(i + 1);
            (arr[i], arr[j]) = (arr[j], arr[i]);
        }
    }
}