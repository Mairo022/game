using System.Text.Json.Serialization;

namespace Server;
using static Server.Utils;

public struct GameState()
{
    public List<string> PlayerDeck = [];
    public List<string> PlayerPile = [];
    public List<string> PlayerReserve = [];
    
    public List<string> OpponentDeck = [];
    public List<string> OpponentPile = [];
    public List<string> OpponentReserve = [];
    
    public List<string> PileLone = [];
    public List<string> PileLtwo = [];
    public List<string> PileLthree = [];
    public List<string> PileLfour = [];
    
    public List<string> PileRone = [];
    public List<string> PileRtwo = [];
    public List<string> PileRthree = [];
    public List<string> PileRfour = [];
    
    public List<string> StackLone = [];
    public List<string> StackLtwo = [];
    public List<string> StackLthree = [];
    public List<string> StackLfour = [];
    
    public List<string> StackRone = [];
    public List<string> StackRtwo = [];
    public List<string> StackRthree = [];
    public List<string> StackRfour = [];

    public int Turn = 0;
}

public enum Rank
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

public enum SuitValues
{
    Err = 0,
    H = 1,
    D = 1,
    C = 2,
    S = 2
}

public record Snapshot(
    [property: JsonPropertyName("player_reserve")] string[] PlayerReserve,
    [property: JsonPropertyName("player_pile")] string[] PlayerPile,
    [property: JsonPropertyName("player_cards_len")] int[] PlayerCardsLengths,
    
    [property: JsonPropertyName("opponent_reserve")] string[] OpponentReserve,
    [property: JsonPropertyName("opponent_pile")] string[] OpponentPile,
    [property: JsonPropertyName("opponent_cards_len")] int[] OpponentCardsLengths,
    
    [property: JsonPropertyName("pile_l_one")] List<string> PileLOne,
    [property: JsonPropertyName("pile_l_two")] List<string> PileLTwo,
    [property: JsonPropertyName("pile_l_three")] List<string> PileLThree,
    [property: JsonPropertyName("pile_l_four")] List<string> PileLFour,
    
    [property: JsonPropertyName("pile_r_one")] List<string> PileROne,
    [property: JsonPropertyName("pile_r_two")] List<string> PileRTwo,
    [property: JsonPropertyName("pile_r_three")] List<string> PileRThree,
    [property: JsonPropertyName("pile_r_four")] List<string> PileRFour,

    [property: JsonPropertyName("stack_l_one")] string[] StackLOne,
    [property: JsonPropertyName("stack_l_two")] string[] StackLTwo,
    [property: JsonPropertyName("stack_l_three")] string[] StackLThree,
    [property: JsonPropertyName("stack_l_four")] string[] StackLFour,

    [property: JsonPropertyName("stack_r_one")] string[] StackROne,
    [property: JsonPropertyName("stack_r_two")] string[] StackRTwo,
    [property: JsonPropertyName("stack_r_three")] string[] StackRThree,
    [property: JsonPropertyName("stack_r_four")] string[] StackRFour,
    
    [property: JsonPropertyName("turn")] int Turn
);

public class State
{
    readonly string[] _suits = ["H", "D", "C", "S"];
    readonly string[] _ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    private readonly char[] _owners = ['0', '1'];
    
    public GameState GameState = new();

    public State()
    {
        CreateDecks();
    }

    void CreateDecks()
    {
        GameState.PlayerDeck = _suits
            .SelectMany(suit =>
                _ranks.Select(rank => $"{suit}{rank}-{_owners[0]}"))
            .ToList();
        
        GameState.OpponentDeck = _suits
            .SelectMany(suit =>
                _ranks.Select(rank => $"{suit}{rank}-{_owners[0]}"))
            .ToList();
        
        Shuffle(GameState.PlayerDeck);
        Shuffle(GameState.OpponentDeck);
        
        GameState.PlayerReserve = GameState.PlayerDeck.Take(10).ToList();
        GameState.PlayerDeck.RemoveRange(0, 10);
        GameState.OpponentReserve = GameState.OpponentDeck.Take(10).ToList();
        GameState.OpponentDeck.RemoveRange(0, 10);
    }

    void DrawCard()
    {
        
    }

    public Snapshot GetSnapshot(int turnId)
    {
        ref var s = ref GameState;
        
        if (turnId == 0)
            return new Snapshot(
                PlayerReserve: s.PlayerReserve.Count > 0 ? [s.PlayerReserve.Last()] : [],
                PlayerPile: s.PlayerPile.Count > 0 ? [s.PlayerPile.Last()] : [],
                PlayerCardsLengths: [s.PlayerReserve.Count, s.PlayerPile.Count, s.PlayerDeck.Count],
                
                OpponentReserve: s.OpponentReserve.Count > 0 ? [s.OpponentReserve.Last()] : [],
                OpponentPile: s.OpponentPile.Count > 0 ? [s.OpponentPile.Last()] : [],
                OpponentCardsLengths: [s.OpponentReserve.Count, s.OpponentPile.Count, s.OpponentDeck.Count],
                
                PileLOne: s.PileLone,
                PileLTwo: s.PileLtwo,
                PileLThree: s.PileLthree,
                PileLFour: s.PileLfour,

                PileROne: s.PileRone,
                PileRTwo: s.PileRtwo,
                PileRThree: s.PileRthree,
                PileRFour: s.PileRfour,

                StackLOne: s.StackLone.Count > 0 ? [s.StackLone.Last()] : [],
                StackLTwo: s.StackLtwo.Count > 0 ? [s.StackLtwo.Last()] : [],
                StackLThree: s.StackLthree.Count > 0 ? [s.StackLthree.Last()] : [],
                StackLFour: s.StackLfour.Count > 0 ? [s.StackLfour.Last()] : [],

                StackROne: s.StackRone.Count > 0 ? [s.StackRone.Last()] : [],
                StackRTwo: s.StackRtwo.Count > 0 ? [s.StackRtwo.Last()] : [],
                StackRThree: s.StackRthree.Count > 0 ? [s.StackRthree.Last()] : [],
                StackRFour: s.StackRfour.Count > 0 ? [s.StackRfour.Last()] : [],
                
                Turn: s.Turn
            );
        
        return new Snapshot(
            PlayerReserve: s.OpponentReserve.Count > 0 ? [s.OpponentReserve.Last()] : [],
            PlayerPile: s.OpponentPile.Count > 0 ? [s.OpponentPile.Last()] : [],
            PlayerCardsLengths:[s.OpponentReserve.Count, s.OpponentPile.Count, s.OpponentDeck.Count],
                
            OpponentReserve: s.PlayerReserve.Count > 0 ? [s.PlayerReserve.Last()] : [],
            OpponentPile: s.PlayerPile.Count > 0 ? [s.PlayerPile.Last()] : [],
            OpponentCardsLengths: [s.PlayerReserve.Count, s.PlayerPile.Count, s.PlayerDeck.Count],
                
            PileLOne: s.PileLone,
            PileLTwo: s.PileLtwo,
            PileLThree: s.PileLthree,
            PileLFour: s.PileLfour,

            PileROne: s.PileRone,
            PileRTwo: s.PileRtwo,
            PileRThree: s.PileRthree,
            PileRFour: s.PileRfour,

            StackLOne: s.StackLone.Count > 0 ? [s.StackLone.Last()] : [],
            StackLTwo: s.StackLtwo.Count > 0 ? [s.StackLtwo.Last()] : [],
            StackLThree: s.StackLthree.Count > 0 ? [s.StackLthree.Last()] : [],
            StackLFour: s.StackLfour.Count > 0 ? [s.StackLfour.Last()] : [],

            StackROne: s.StackRone.Count > 0 ? [s.StackRone.Last()] : [],
            StackRTwo: s.StackRtwo.Count > 0 ? [s.StackRtwo.Last()] : [],
            StackRThree: s.StackRthree.Count > 0 ? [s.StackRthree.Last()] : [],
            StackRFour: s.StackRfour.Count > 0 ? [s.StackRfour.Last()] : [],
                
            Turn: s.Turn
        );
    }
    
    public static Rank GetRank(string rank) => rank switch
    {
        "A" => Rank.A,
        "2" => Rank._2,
        "3" => Rank._3,
        "4" => Rank._4,
        "5" => Rank._5,
        "6" => Rank._6,
        "7" => Rank._7,
        "8" => Rank._8,
        "9" => Rank._9,
        "10" => Rank._10,
        "J" => Rank.J,
        "Q" => Rank.Q,
        "K" => Rank.K,
        _ => Rank.Err
    };
}