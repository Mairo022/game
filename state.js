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
        turn: 0,
        is_mp: false
    }
}

function reset_state() {
    Object.assign(state, create_state());
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

function state_move_card(src, target) {
    const card_value = Array.isArray(state[src]) ? state[src].at(-1).split("-")[0] : state[src].split("-")[0];
    state[target].push(card_value);
    if (Array.isArray(state[src])) state[src].pop();
}

function state_apply_snapshot(snap) {
    Object.assign(state, snap);
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
}
