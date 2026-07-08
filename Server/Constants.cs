namespace Server;

public static class Constants
{
    public static readonly string[] SUITS = ["H", "D", "C", "S"];
    public static readonly string[] RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    public static  readonly int[] OWNERS = [0, 1];
    
    public enum RANK_VALUE
    {
        Err = 0,
        A = 1,
        _2 = 2,
        _3 = 3,
        _4 = 4,
        _5 = 5,
        _6 = 6,
        _7 = 7,
        _8 = 8,
        _9 = 9,
        _10 = 10,
        J = 11,
        Q = 12,
        K = 13
    }
    
    public enum SUIT_VALUE
    {
        Err = 0,
        H = 1,
        D = 1,
        C = 2,
        S = 2
    }
}