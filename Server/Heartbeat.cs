using System.Net.WebSockets;
using System.Text;

namespace Server;

public static class Heartbeat
{
    static readonly byte[] _ping = Encoding.UTF8.GetBytes("{\"Type\":\"ping\"}");
    static TimeSpan _pingInterval = TimeSpan.FromSeconds(1);
    
    public static async Task HeartbeatLoop(Dictionary<string, Connection> connections, TimeSpan timespan)
    {
        try
        {
            _pingInterval = timespan / 3;

            while (true)
            {
                foreach (var player in connections.Values)
                {
                    if (DateTime.Now - player.LastSeen > timespan)
                    {
                        player.Cts.Cancel();
                        continue;
                    }

                    if (player.Socket.State == WebSocketState.Open)
                    {
                        await player.Socket.SendAsync(
                            _ping,
                            WebSocketMessageType.Text,
                            true,
                            player.Cts.Token);
                    }
                }
                await Task.Delay(_pingInterval);
            }
        }
        catch (Exception e)
        {
            Console.BackgroundColor = ConsoleColor.DarkRed;
            Console.Error.WriteLine($"[ERROR] Heartbeat failed:\n   {e}");
            Console.ResetColor();
        }
    }
}