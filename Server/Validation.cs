namespace Server;
using static Server.Constants;

public static class Validation
{
    public static bool IsValidMove(MoveMessage incoming, ref GameState state, bool isPlayer)
    {
        var src = State.GetList(incoming.Src, ref state);
        var dst = State.GetList(incoming.Target, ref state);
        if (src is null || dst is null ) { Console.WriteLine("Could not find src/dst list"); return false; }
        if (src.Count == 0) return false;

        if (state.IsCardDrawn && (
                (isPlayer && !incoming.Src.Equals("player_pile")) ||
                (!isPlayer && !incoming.Src.Equals("opponent_pile"))
                )) return false;
        if (incoming.Target.StartsWith("pile")) return IsValidPileDrop(src, dst);
        if (incoming.Target.StartsWith("stack")) return IsValidStackDrop(src, dst);
        if (incoming.Target.StartsWith("opponent") || incoming.Target.StartsWith("player")) 
            return IsValidPlayerDrop(src, dst);
        
        return false;
    }
    
    static bool IsValidPileDrop(List<Card> src, List<Card> dst)
    {
        var srcCard = src.Last();
        var dstCard = dst.LastOrDefault();
        
        if (srcCard.RankValue == RANK_VALUE.A) return false;
        if (dst.Count == 0) return true;
        if (srcCard.SuitValue == dstCard.SuitValue) return false;
        if (srcCard.RankValue >= dstCard.RankValue) return false;
        
        return true;
    }
    
    static bool IsValidStackDrop(List<Card> src, List<Card> dst)
    {
        var srcCard = src.Last();
        var dstCard = dst.LastOrDefault();
        
        if (dst.Count == 0) return (int) src.Last().RankValue == 1;
        if (srcCard.RankValue == dstCard.RankValue + 1 && srcCard.Suit == dstCard.Suit) return true;
        
        return false;
    }
    
    static bool IsValidPlayerDrop(List<Card> src, List<Card> dst)
    {
        var srcCard = src.Last();
        var dstCard = dst.LastOrDefault();

        if (dst.Count == 0) return false;
        if ((srcCard.RankValue + 1 == dstCard.RankValue || srcCard.RankValue -1 == dstCard.RankValue)
            && srcCard.Suit == dstCard.Suit) 
            return true;
        
        return false;
    }
    
    public static bool IsValidTurnEnd(Connection conn, ref GameState state)
    {
        var pileLength = conn.TurnId == 0 ? state.PlayerPile.Count : state.OpponentPile.Count;
        var deckLength = conn.TurnId == 0 ? state.PlayerDeck.Count : state.OpponentDeck.Count;
        
        if (pileLength <= 1 && deckLength == 0) return true;
        return state.IsCardDrawn;
    }

    public static bool IsValidDrawCard(ref GameState state) => state.IsCardDrawn;
    public static bool IsPlayerTurn(Connection conn, ref GameState state) => state.TurnPlayerId == conn.TurnId;
}

