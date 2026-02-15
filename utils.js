import {rank_order, suit_values} from "./constants.js";

function create_card_obj(card) {
    if (!card) return null;

    const [card_value, owner] = card.split("-")
    const card_suit = card_value[0]
    const card_rank = card_value.slice(1)

    return {
        suit: card_suit,
        rank: card_rank,
        rank_value: rank_order[card_rank],
        suit_value: suit_values[card_suit],
        owner: owner,
    }
}

export {
    create_card_obj
}