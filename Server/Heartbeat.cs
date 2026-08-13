using System.Net.WebSockets;
using System.Text;

namespace Server;

public static class Heartbeat
{
    static readonly byte[] _ping = Encoding.UTF8.GetBytes("{\"Type\":\"ping\"}");
    static TimeSpan _pingInterval = TimeSpan.FromSeconds(1);
    
    public static async Task HeartbeatLoop(Dictionary<string, Connection> connections, TimeSpan timespan)
    {
        _pingInterval = timespan / 3;
        
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
                        player.DisconnectFromRoom();
                        connections.Remove(kvp.Key);
                        
                        if (player.Socket.State == WebSocketState.Open)
                            await player.Socket.CloseAsync(
                                WebSocketCloseStatus.NormalClosure,
                                "Timeout",
                                CancellationToken.None);
                        
                        player.Socket.Dispose();
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
                        player.DisconnectFromRoom();
                        connections.Remove(kvp.Key);
                        player.Socket.Dispose();
                    }
                }
            }

            await Task.Delay(_pingInterval);
        }
    }
}