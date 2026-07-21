using System.Net.WebSockets;
using System.Text;

namespace Server;

public static class Heartbeat
{
    static byte[] _ping = Encoding.UTF8.GetBytes("{\"Type\":\"ping\"}");
    
    public static async Task HeartbeatLoop(Dictionary<string, Connection> connections, TimeSpan timespan)
    {
        while (true)
        {
            foreach (var kvp in connections)
            {
                var player = kvp.Value;
                
                if (DateTime.Now - player.LastSeen > timespan)
                {
                    Console.WriteLine("Player timed out.");

                    try
                    {
                        await player.Socket.CloseAsync(
                            WebSocketCloseStatus.NormalClosure,
                            "Timeout",
                            CancellationToken.None);
                    }
                    catch {}
                    
                    continue;
                }
            
                if (player.Socket.State == WebSocketState.Open)
                {
                    try
                    {
                        await player.Socket.SendAsync(
                            _ping,
                            WebSocketMessageType.Text,
                            true,
                            CancellationToken.None);
                    }
                    catch
                    {
                        connections.Remove(kvp.Key);
                    }
                }
            }

            await Task.Delay(5000);
        }
    }
}