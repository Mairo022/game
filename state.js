import {create_deck, shuffle} from "./utils.js";

const state = create_state();

// SP uses lists, MP uses first value in list
function create_state() {
    return {
        player_reserve: [],
        player_pile: [],
        player_deck: [], // SP only
        player_cards_len: [0, 0, 0],
        opponent_deck: [], // SP only
        opponent_reserve: [],
        opponent_pile: [],
        opponent_cards_len: [0, 0, 0],
        pile_l_one: [],
        pile_l_two: [],
        pile_l_three: [],
        pile_l_four: [],
        pile_r_one: [],
        pile_r_two: [],
        pile_r_three: [],
        pile_r_four: [],
        stack_l_one: [],
        stack_l_two: [],
        stack_l_three: [],
        stack_l_four: [],
        stack_r_one: [],
        stack_r_two: [],
        stack_r_three: [],
        stack_r_four: [],
        state: 0,
        player_id: 0,
        turn_player_id: 0,
        is_card_drawn: false,
        is_mp: false
    }
}

function reset_state() {
    Object.assign(state, create_state());
}

function state_end_turn(player_id) {
    state.turn_player_id = !player_id * 1;
}

function state_draw_card() {
    state.player_pile.push(state.player_deck.at(-1));
    state.player_deck.pop();
}

function state_is_deck_empty() {
    return state.player_deck.length === 0;
}

function state_is_reserve_empty() {
    return state.player_reserve.length === 0;
}

function state_is_player_pile_empty() {
    return state.player_pile.length === 0;
}

function state_pile_to_deck() {
    state.player_deck.push(...state.player_pile.toReversed());
    state.player_pile.length = 0;
}

function state_allow_draw_card() {
    state.is_card_drawn = false;
}

function state_disable_card_draw() {
    state.is_card_drawn = true;
}

function state_move_card(src, target) {
    const card_value = state[src].at(-1).split("-")[0];

    if (state.is_mp) state[target][0] = card_value;
    else state[target].push(card_value);

    state[src].pop();

    if (!state.is_mp) return;
    console.log(src, target);

    if (src.startsWith("player")) {
        if (src === "player_pile") state.player_cards_len[1]--;
        if (src === "player_reserve") state.player_cards_len[0]--;
    }
    else if (src.startsWith("opponent")) {
        if (src === "opponent_pile") state.opponent_cards_len[1]--;
        if (src === "opponent_reserve") state.opponent_cards_len[0]--;
    }

    if (target.startsWith("player")) {
        if (target === "player_reserve") state.player_cards_len[0]++;
        if (target === "player_pile") state.player_cards_len[1]++;
    } else if (target.startsWith("opponent")) {
        if (target === "opponent_reserve") state.opponent_cards_len[0]++;
        if (target === "opponent_pile") state.opponent_cards_len[1]++;
    }
}

function state_apply_snapshot(snap) {
    Object.assign(state, snap);
}

function state_set_player_id(player_id) {
    state.player_id = player_id;
}

function state_init_decks() {
    const deck = create_deck();
    shuffle(deck);
    state.player_reserve = deck.slice(0, 10);
    state.player_deck = deck.slice(10);

    const deck2 = create_deck();
    shuffle(deck2);
    state.opponent_reserve = deck2.slice(0, 10);
    state.opponent_deck = deck2.slice(10);
}

export {
    state,
    reset_state,
    state_draw_card,
    state_is_deck_empty,
    state_is_reserve_empty,
    state_is_player_pile_empty,
    state_pile_to_deck,
    state_move_card,
    state_apply_snapshot,
    state_end_turn,
    state_init_decks,
    state_set_player_id,
    state_allow_draw_card,
    state_disable_card_draw
}
