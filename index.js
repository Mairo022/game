import {SUITS, RANKS, OWNERS, pile_names, stack_names} from "./constants.js"
import {update_player_cards, update_piles} from "./render.js";
import {is_valid_pile_drop} from "./validation.js";

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

// This file holds state and events

const state = {
    player_reserve: [],
    player_deck: [],
    card_index: 0,
    opponent_deck: [],
    opponent_reserve: [],
    opponent_cards: [],
    turn: 0,
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
}

state.player_reserve = deck.slice(0, 10);
state.player_deck = deck.slice(10);
state.card_index = 0;

const el_player_reserve = document.querySelector("#p_one_reserve")
const el_player_card_area = document.querySelector("#p_one_card")
const el_player_deck_area = document.querySelector("#p_one_deck")

update_player_cards(el_player_reserve, el_player_card_area, el_player_deck_area, state)

const game_field = document.querySelector("#game_field")
// Moving the cards

let ghost;
let offset_x = 0;
let offset_y = 0;

const pile_areas = pile_names.map(pile => document.getElementById(pile));
const stack_areas = stack_names.map(stack => document.getElementById(stack));
pile_areas.forEach(pile => {pile.addEventListener("pointerdown", on_pile_pointer_down)})

const main_card = el_player_card_area.querySelector(".main_card_one");
const reserve_card = el_player_reserve.querySelector(".reserve_card");
main_card.addEventListener("pointerdown", on_card_pointer_down);
reserve_card.addEventListener("pointerdown", on_card_pointer_down);

function on_pile_pointer_down(e) {
    const card = e.target
    const value = card.dataset.value;
    const pile_id = card.parentElement.id;
    const rect = card.getBoundingClientRect();

    if (!value || !pile_id) return;

    // Check if clicked on last/pickable card
    const last_pile_value = state[pile_id].at(-1).split("-")[0];
    if (last_pile_value !== value) return;

    create_ghost_card(card, {e_x : e.clientX, e_y: e.clientY, r_l: rect.left, r_t: rect.top});
    window.addEventListener("pointermove", on_card_pointer_move);
    window.addEventListener("pointerup", on_card_pointer_up);
}

function on_card_pointer_down(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();

    create_ghost_card(card, {e_x : e.clientX, e_y: e.clientY, r_l: rect.left, r_t: rect.top});
    window.addEventListener("pointermove", on_card_pointer_move);
    window.addEventListener("pointerup", on_card_pointer_up);
}

function on_card_pointer_move(e) {
    if (!ghost) return;

    ghost.style.left = (e.clientX - offset_x) + "px";
    ghost.style.top = (e.clientY - offset_y) + "px";
}

function on_card_pointer_up(e) {
    if (!ghost) return;

    const is_reserve = ghost.classList.contains("reserve_card")
    const is_main_card = ghost.classList.contains("main_card_one")
    const is_pile_card = (ghost.classList.contains("pile_left_card")
        || ghost.classList.contains("pile_right_card"));

    if (e.target.parentElement.classList.contains("pile") || e.target.classList.contains("pile")) {
        let is_valid_move = true;
        let id = e.target.id

        if (!id) id = e.target.parentElement.id;
        if (!id) console.error("Drop ID not found {on_card_pointer_up}")

        if (is_main_card) is_valid_move = handle_main_card_drop(id)
        if (is_reserve) is_valid_move = handle_reserve_card_drop(id)
        if (is_pile_card) is_valid_move = handle_pile_card_drop(id, ghost.dataset.src)

        if (is_valid_move) update_piles(state)
    }

    ghost.remove();
    ghost = null;

    window.removeEventListener("pointermove", on_card_pointer_move);
    window.removeEventListener("pointerup", on_card_pointer_up);
}

function handle_pile_card_drop(target_id, src_id) {
    const card = state[src_id].at(-1)

    if (!is_valid_pile_drop(target_id, card, state))
        return false;

    state[target_id].push(state[src_id].at(-1));
    state[src_id].pop();
    update_piles(state);

    return true;
}

function handle_reserve_card_drop(target_id) {
    const card = state.player_reserve[0];

    if (!is_valid_pile_drop(target_id, card, state))
        return false;

    state[target_id].push(card);
    state.player_reserve.splice(0, 1)
    update_player_cards(el_player_reserve, el_player_card_area, el_player_deck_area, state)

    return true;
}

function handle_main_card_drop(target_id) {
    const card = state.player_deck[state.card_index];

    if (!is_valid_pile_drop(target_id, card, state)) {
        return false;
    }

    state[target_id].push(card);
    state.player_deck.splice(state.card_index, 1)
    state.card_index--;
    update_player_cards(el_player_reserve, el_player_card_area, el_player_deck_area, state)

    return true;
}

function create_ghost_card(card, position) {
    console.log(position)
    console.log(card)
    offset_x = position.e_x - position.r_l;
    offset_y = position.e_y - position.r_t;

    ghost = card.cloneNode(true);
    ghost.style.position = "fixed";
    ghost.style.left = position.r_l + "px";
    ghost.style.top = position.r_t + "px";
    ghost.style.pointerEvents = "none";
    ghost.style.zIndex = "9999";

    document.body.appendChild(ghost);
}

// Getting new card

el_player_deck_area.addEventListener("click", on_deck_click);

function on_deck_click() {
    if (state.card_index === state.player_deck.length - 1) {
        state.card_index = -1;
    }
    state.card_index++;
    update_player_cards(el_player_reserve, el_player_card_area, el_player_deck_area, state)
}
