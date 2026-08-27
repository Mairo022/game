using System.Text.Json;
using static Server.Utils;

namespace Server;

public abstract record IncomingMessage
{
    public required string Type { get; init; }
}

public record MoveMessage : MoveMessageOut
{
    public required int Player { get; init; }
    public required int State { get; init; }
}

public record MoveMessageOut : IncomingMessage
{
    public required string Src { get; set; }
    public required string Target { get; set; }
}

public record MoveUndoMessageOut : MoveMessageOut
{
    public string SrcRepl { get; set; } = "";
    public int TurnId { get; set; }
}

public record OutgoingMessage<T>(string Type, T? Data)
{
    public byte[] Json() => JsonSerializer.SerializeToUtf8Bytes(this, JsonIgnoreNull);
}
