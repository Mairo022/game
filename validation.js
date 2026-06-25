import {create_card_obj} from "./utils.js";
import {TARGETS} from "./constants.js";

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

function is_valid_stack_drop(stack_id, card_str, state) {
    const stack = state[stack_id]
    const stack_card = create_card_obj(stack.at(-1))
    const card = create_card_obj(card_str)

    if (stack.length === 0) return card.rank_value === 1;
    if (stack_card.rank_value + 1 === card.rank_value
        && stack_card.suit === card.suit) return true;

    return false;
}

function is_valid_opponent_drop(opponent_id, card_str, state) {
    const opponent = state[opponent_id].at(-1);
    const opponent_card = create_card_obj(opponent);
    const card = create_card_obj(card_str);

    if (!opponent_card) return false;
    if ((opponent_card.rank_value + 1 === card.rank_value
        || opponent_card.rank_value - 1 === card.rank_value
        ) && opponent_card.suit === card.suit)
        return true;

    return false;
}

function is_valid_move(target_id, card, state, target) {
    if (TARGETS.pile === target) return is_valid_pile_drop(target_id, card, state);
    if (TARGETS.stack === target) return is_valid_stack_drop(target_id, card, state);
    if (TARGETS.opponent_pile === target || TARGETS.opponent_reserve === target) {
        return is_valid_opponent_drop(target_id, card, state);
    }
    console.error("Err: Unknown drop target {is_valid_move}");
    return false;
}

export  {
    is_valid_move
}