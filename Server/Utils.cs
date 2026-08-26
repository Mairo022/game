using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using static Server.Constants;

namespace Server;

public static class Utils
{
    static Random _random = new();
    
    static readonly ILogger Logger = Log.For(typeof(Utils));
    
    public static string GenerateString(int length)
    {
        return new string(
            Enumerable.Range(0, length)
                .Select(_ => CHARS[_random.Next(CHARS.Length)])
                .ToArray());
    }
    
    public static readonly JsonSerializerOptions JsonIgnoreNull = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };
    
    public static async Task SocketSendAsync(WebSocket? socket, string message, CancellationToken ct)
    {
        if (socket is null || socket.State != WebSocketState.Open) return;
        
        await socket.SendAsync(
            Encoding.UTF8.GetBytes(message),
            WebSocketMessageType.Text,
            true,
            ct
        );
    }
    
    public static async Task SocketSendAsync(WebSocket? socket, byte[] message, CancellationToken ct)
    {
        if (socket is null || socket.State != WebSocketState.Open) return;
        
        Logger.LogInformation($"Sending {message.Length} bytes");
        await socket.SendAsync(
            message,
            WebSocketMessageType.Text,
            true,
            ct
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
    
    public static RANK_VALUE GetRank(string rank) => rank switch
    {
        "A" => RANK_VALUE.A,
        "2" => RANK_VALUE._2,
        "3" => RANK_VALUE._3,
        "4" => RANK_VALUE._4,
        "5" => RANK_VALUE._5,
        "6" => RANK_VALUE._6,
        "7" => RANK_VALUE._7,
        "8" => RANK_VALUE._8,
        "9" => RANK_VALUE._9,
        "10" => RANK_VALUE._10,
        "J" => RANK_VALUE.J,
        "Q" => RANK_VALUE.Q,
        "K" => RANK_VALUE.K,
        _ => RANK_VALUE.Err
    };
    
    public static byte[] ToJson<T>(ref T data)
    {
        return JsonSerializer.SerializeToUtf8Bytes(data);
    }
    
    public static IncomingMessage? DeserializeMessage(string json)
    {
        using var document = JsonDocument.Parse(json);

        var root = document.RootElement;

        if (!root.TryGetProperty("Type", out var typeProperty))
        {
            return null;
        }

        return typeProperty.GetString() switch
        {
            "Move" => root.Deserialize<MoveMessage>(),
            _      => null
        };
    }
    
    public static bool TryParseJson(string json, out JsonElement root)
    {
        try
        {
            var doc = JsonDocument.Parse(json);
            root = doc.RootElement.Clone();
            return true;
        }
        catch
        {
            root = default;
            return false;
        }
    }
    
    public static bool TryParseJson(string json, out JsonElement rootOut, out string typeOut)
    {
        rootOut = default;
        typeOut = string.Empty;

        try
        {
            var root = JsonDocument.Parse(json).RootElement;
            var type = root.GetProperty("Type").GetString();

            if (type is null || string.IsNullOrEmpty(type)) return false;
            
            rootOut = root.Clone();
            typeOut = type;
            
            return true;
        }
        catch
        {
            return false;
        }
    }

    public static bool TryDeserializeRoot<T>(JsonElement root, out T? obj)
    {
        try
        {
            obj = root.Deserialize<T>();
            return obj is not null;
        }
        catch
        {
            obj = default;
            return false;
        }
    }

    public static byte[] CreateOutMsg<T>(string type, T? data) => new OutgoingMessage<T>(type, data).Json();
    public static byte[] CreateOutMsg<T>(string type, ref T data) => new OutgoingMessage<T>(type, data).Json();
}