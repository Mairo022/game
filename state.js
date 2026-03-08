import {OWNERS, RANKS, SUITS} from "./constants.js";

// Server side

const deck = create_deck();
shuffle(deck);

function create_deck() {
    return SUITS.flatMap(suit => RANKS.map(rank => `${suit}${rank}-${OWNERS[0]}`));
}

function shuffle(arr) {
    let i = arr.length, j, temp;

    while (--i > 0) {
        j = Math.floor(Math.random() * (i + 1));
        temp = arr[j];
        arr[j] = arr[i];
        arr[i] = temp;
    }
}

// END

const state = {
    player_reserve: [],
    player_pile: [],
    player_deck: [],
    opponent_deck: [],
    opponent_reserve: [],
    opponent_cards: [],
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
}

state.player_reserve = deck.slice(0, 10);
state.player_deck = deck.slice(10);

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
    state[target].push(state[src].at(-1));
    state[src].pop()
}

export {
    state,
    state_draw_card,
    state_is_deck_empty,
    state_is_reserve_empty,
    state_is_player_pile_empty,
    state_pile_to_deck,
    state_move_card,
}
