import {create_card_obj} from "./utils.js";

function is_valid_pile_drop(pile_id, card_str, state) {
    const pile = state[pile_id]
    const pile_card = create_card_obj(pile.at(-1))
    const card = create_card_obj(card_str)

    if (card.rank === "A") return false;
    if (pile.length === 0) return true;
    if (card.suit_value === pile_card.suit_value) return false;
    if (card.rank_value + 1 !== pile_card.rank_value) return false;

    return true;
}

export  {
    is_valid_pile_drop
}