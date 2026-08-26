namespace Server;

public static class Log
{
    static ILoggerFactory _factory = null!;

    public static void Init(ILoggerFactory factory) => _factory = factory;
    public static ILogger<T> For<T>() => _factory.CreateLogger<T>();
    public static ILogger For(Type type) => _factory.CreateLogger(type);
}