using System.Net.WebSockets;
using System.Text;

namespace Server;

public static class Heartbeat
{
    static readonly byte[] _ping = Encoding.UTF8.GetBytes("{\"Type\":\"ping\"}");
    static TimeSpan _pingInterval = TimeSpan.FromSeconds(1);
    static readonly ILogger Logger = Log.For(typeof(Heartbeat));
    
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
            Logger.LogError($"[ERROR] Heartbeat failed:\n   {e}");
        }
    }
}