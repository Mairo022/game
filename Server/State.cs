using System.Text.Json.Serialization;

namespace Server;
using static Server.Utils;
using static Server.Constants;

public readonly struct Card(string suit, string rank, int owner)
{
    public readonly string Name = $"{suit}{rank}-{owner}";
    public readonly string Suit = suit;
    public readonly string Rank = rank;
    public readonly RANK_VALUE RankValue = GetRank(rank);
    public readonly SUIT_VALUE SuitValue = Enum.Parse<SUIT_VALUE>(suit);
    public readonly int Owner = owner;
}

public class State
{
    public GameState GameState = new();

    public State() => CreateDecks();

    void CreateDecks()
    {
        GameState.PlayerDeck = SUITS
            .SelectMany(suit => RANKS.Select(rank => new Card(suit, rank, OWNERS[0])))
            .ToList();
        
        GameState.OpponentDeck = SUITS
            .SelectMany(suit => RANKS.Select(rank => new Card(suit, rank, OWNERS[1])))
            .ToList();
        
        Shuffle(GameState.PlayerDeck);
        Shuffle(GameState.OpponentDeck);
        
        GameState.PlayerReserve = GameState.PlayerDeck.Take(10).ToList();
        GameState.PlayerDeck.RemoveRange(0, 10);
        GameState.OpponentReserve = GameState.OpponentDeck.Take(10).ToList();
        GameState.OpponentDeck.RemoveRange(0, 10);
    }

    public void MoveCard(MoveMessage move)
    {
        var src = GetList(move.Src, ref GameState)!;
        var dst = GetList(move.Target, ref GameState)!;
        
        dst.Add(src.Last());
        src.RemoveAt(src.Count - 1);
    }

    public Card? DrawReserveCard(int playerId) => playerId == 0 
        ? GameState.PlayerReserve.LastOrDefault() 
        : GameState.OpponentReserve.LastOrDefault();
    
    public Card? DrawCard(int playerId)
    {
        var isPlayer = playerId == 0;
        var deck = isPlayer ? GameState.PlayerDeck : GameState.OpponentDeck;
        var pile = isPlayer ? GameState.PlayerPile : GameState.OpponentPile;
        
        if (deck.Count == 0)
        {
            if (pile.Count == 0) return null;
            
            deck.AddRange(pile);
            deck.Reverse();
            pile.Clear();
        }
        
        pile.Add(deck.Last());
        deck.RemoveAt(deck.Count - 1);
        
        return pile.Last();
    }

    public Card? GetPlayerPileCard(int playerId) => 
        playerId == 0 ? GameState.PlayerPile.LastOrDefault() : GameState.OpponentPile.LastOrDefault();
    
    public static List<Card>? GetList(string name, ref GameState gameState) => name switch
    {
        "player_deck" => gameState.PlayerDeck,
        "player_pile" => gameState.PlayerPile,
        "player_reserve" => gameState.PlayerReserve,

        "opponent_deck" => gameState.OpponentDeck,
        "opponent_pile" => gameState.OpponentPile,
        "opponent_reserve" => gameState.OpponentReserve,

        "pile_l_one" => gameState.PileLone,
        "pile_l_two" => gameState.PileLtwo,
        "pile_l_three" => gameState.PileLthree,
        "pile_l_four" => gameState.PileLfour,

        "pile_r_one" => gameState.PileRone,
        "pile_r_two" => gameState.PileRtwo,
        "pile_r_three" => gameState.PileRthree,
        "pile_r_four" => gameState.PileRfour,

        "stack_l_one" => gameState.StackLone,
        "stack_l_two" => gameState.StackLtwo,
        "stack_l_three" => gameState.StackLthree,
        "stack_l_four" => gameState.StackLfour,

        "stack_r_one" => gameState.StackRone,
        "stack_r_two" => gameState.StackRtwo,
        "stack_r_three" => gameState.StackRthree,
        "stack_r_four" => gameState.StackRfour,
        _ => null
    };

    public Snapshot GetSnapshot(int turnId)
    {
        ref var s = ref GameState;
        
        if (turnId == 0)
            return new Snapshot(
                PlayerReserve: s.PlayerReserve.Count > 0 ? [s.PlayerReserve.Last().Name] : [],
                PlayerPile: s.PlayerPile.Count > 0 ? [s.PlayerPile.Last().Name] : [],
                PlayerCardsLengths: [s.PlayerReserve.Count, s.PlayerPile.Count, s.PlayerDeck.Count],
                
                OpponentReserve: s.OpponentReserve.Count > 0 ? [s.OpponentReserve.Last().Name] : [],
                OpponentPile: s.OpponentPile.Count > 0 ? [s.OpponentPile.Last().Name] : [],
                OpponentCardsLengths: [s.OpponentReserve.Count, s.OpponentPile.Count, s.OpponentDeck.Count],
                
                PileLOne: s.PileLone.Select(c => c.Name).ToArray(),
                PileLTwo: s.PileLtwo.Select(c => c.Name).ToArray(),
                PileLThree: s.PileLthree.Select(c => c.Name).ToArray(),
                PileLFour: s.PileLfour.Select(c => c.Name).ToArray(),

                PileROne: s.PileRone.Select(c => c.Name).ToArray(),
                PileRTwo: s.PileRtwo.Select(c => c.Name).ToArray(),
                PileRThree: s.PileRthree.Select(c => c.Name).ToArray(),
                PileRFour: s.PileRfour.Select(c => c.Name).ToArray(),

                StackLOne: s.StackLone.Count > 0 ? [s.StackLone.Last().Name] : [],
                StackLTwo: s.StackLtwo.Count > 0 ? [s.StackLtwo.Last().Name] : [],
                StackLThree: s.StackLthree.Count > 0 ? [s.StackLthree.Last().Name] : [],
                StackLFour: s.StackLfour.Count > 0 ? [s.StackLfour.Last().Name] : [],

                StackROne: s.StackRone.Count > 0 ? [s.StackRone.Last().Name] : [],
                StackRTwo: s.StackRtwo.Count > 0 ? [s.StackRtwo.Last().Name] : [],
                StackRThree: s.StackRthree.Count > 0 ? [s.StackRthree.Last().Name] : [],
                StackRFour: s.StackRfour.Count > 0 ? [s.StackRfour.Last().Name] : [],
                
                Turn: s.Turn
            );
        
        return new Snapshot(
            PlayerReserve: s.OpponentReserve.Count > 0 ? [s.OpponentReserve.Last().Name] : [],
            PlayerPile: s.OpponentPile.Count > 0 ? [s.OpponentPile.Last().Name] : [],
            PlayerCardsLengths:[s.OpponentReserve.Count, s.OpponentPile.Count, s.OpponentDeck.Count],
                
            OpponentReserve: s.PlayerReserve.Count > 0 ? [s.PlayerReserve.Last().Name] : [],
            OpponentPile: s.PlayerPile.Count > 0 ? [s.PlayerPile.Last().Name] : [],
            OpponentCardsLengths: [s.PlayerReserve.Count, s.PlayerPile.Count, s.PlayerDeck.Count],
                
            PileLOne: s.PileLone.Select(c => c.Name).ToArray(),
            PileLTwo: s.PileLtwo.Select(c => c.Name).ToArray(),
            PileLThree: s.PileLthree.Select(c => c.Name).ToArray(),
            PileLFour: s.PileLfour.Select(c => c.Name).ToArray(),

            PileROne: s.PileRone.Select(c => c.Name).ToArray(),
            PileRTwo: s.PileRtwo.Select(c => c.Name).ToArray(),
            PileRThree: s.PileRthree.Select(c => c.Name).ToArray(),
            PileRFour: s.PileRfour.Select(c => c.Name).ToArray(),

            StackLOne: s.StackLone.Count > 0 ? [s.StackLone.Last().Name] : [],
            StackLTwo: s.StackLtwo.Count > 0 ? [s.StackLtwo.Last().Name] : [],
            StackLThree: s.StackLthree.Count > 0 ? [s.StackLthree.Last().Name] : [],
            StackLFour: s.StackLfour.Count > 0 ? [s.StackLfour.Last().Name] : [],

            StackROne: s.StackRone.Count > 0 ? [s.StackRone.Last().Name] : [],
            StackRTwo: s.StackRtwo.Count > 0 ? [s.StackRtwo.Last().Name] : [],
            StackRThree: s.StackRthree.Count > 0 ? [s.StackRthree.Last().Name] : [],
            StackRFour: s.StackRfour.Count > 0 ? [s.StackRfour.Last().Name] : [],
                
            Turn: s.Turn
        );
    }
}

public struct GameState()
{
    public List<Card> PlayerDeck = [];
    public List<Card> PlayerPile = [];
    public List<Card> PlayerReserve = [];
    
    public List<Card> OpponentDeck = [];
    public List<Card> OpponentPile = [];
    public List<Card> OpponentReserve = [];
    
    public List<Card> PileLone = [];
    public List<Card> PileLtwo = [];
    public List<Card> PileLthree = [];
    public List<Card> PileLfour = [];
    
    public List<Card> PileRone = [];
    public List<Card> PileRtwo = [];
    public List<Card> PileRthree = [];
    public List<Card> PileRfour = [];
    
    public List<Card> StackLone = [];
    public List<Card> StackLtwo = [];
    public List<Card> StackLthree = [];
    public List<Card> StackLfour = [];
    
    public List<Card> StackRone = [];
    public List<Card> StackRtwo = [];
    public List<Card> StackRthree = [];
    public List<Card> StackRfour = [];

    public int Turn = 0;
}

public record Snapshot(
    [property: JsonPropertyName("player_reserve")] string[] PlayerReserve,
    [property: JsonPropertyName("player_pile")] string[] PlayerPile,
    [property: JsonPropertyName("player_cards_len")] int[] PlayerCardsLengths,
    
    [property: JsonPropertyName("opponent_reserve")] string[] OpponentReserve,
    [property: JsonPropertyName("opponent_pile")] string[] OpponentPile,
    [property: JsonPropertyName("opponent_cards_len")] int[] OpponentCardsLengths,
    
    [property: JsonPropertyName("pile_l_one")] string[] PileLOne,
    [property: JsonPropertyName("pile_l_two")] string[] PileLTwo,
    [property: JsonPropertyName("pile_l_three")] string[] PileLThree,
    [property: JsonPropertyName("pile_l_four")] string[] PileLFour,
    
    [property: JsonPropertyName("pile_r_one")] string[] PileROne,
    [property: JsonPropertyName("pile_r_two")] string[] PileRTwo,
    [property: JsonPropertyName("pile_r_three")] string[] PileRThree,
    [property: JsonPropertyName("pile_r_four")] string[] PileRFour,

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
