import {OWNERS, pile_names, RANKS, stack_names, SUITS, TARGETS} from "./constants.js"
import {update_piles, update_player_cards, update_stacks} from "./render.js";
import {is_valid_move} from "./validation.js";
import {arr_insert_at} from "./utils.js";

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
state.card_index = 0;

const card_width = document.querySelector(".card").getBoundingClientRect().width;
const card_overlap = 75;

const el_player_reserve = document.querySelector("#p_one_reserve")
const el_player_card_area = document.querySelector("#p_one_card")
const el_player_deck_area = document.querySelector("#p_one_deck")

update_player_cards(el_player_reserve, el_player_card_area, el_player_deck_area, state)

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

    const is_pile_drop = (
        e.target.parentElement.classList.contains("pile") || e.target.classList.contains("pile"));

    if (is_pile_drop) {
        let is_valid_move = true;
        let id = e.target.id

        if (!id) id = e.target.parentElement.id;
        if (!id) console.error("Drop ID not found {on_card_pointer_up}")

        if (is_main_card) is_valid_move = handle_main_card_drop(id, TARGETS.pile)
        if (is_reserve) is_valid_move = handle_reserve_card_drop(id, TARGETS.pile)
        if (is_pile_card) is_valid_move = handle_pile_card_drop(id, TARGETS.pile, ghost.dataset.src)
    }

    const is_stack_drop = e.target.classList.contains("stack")

    if (is_stack_drop) {
        let is_valid_move = true;
        const id = e.target.id;

        if (is_main_card) is_valid_move = handle_main_card_drop(id, TARGETS.stack)
        if (is_reserve) is_valid_move = handle_reserve_card_drop(id, TARGETS.stack)
        if (is_pile_card) is_valid_move = handle_pile_card_drop(id, TARGETS.stack, ghost.dataset.src)
    }

    ghost.remove();
    ghost = null;

    window.removeEventListener("pointermove", on_card_pointer_move);
    window.removeEventListener("pointerup", on_card_pointer_up);
}

function handle_pile_card_drop(target_id, target, src_id) {
    const card = state[src_id].at(-1)

    if (!is_valid_move(target_id, card, state, target)) return false;
    state[target_id].push(state[src_id].at(-1));
    state[src_id].pop();

    update_piles(state);
    update_stacks(state);
    update_player_cards(el_player_reserve, el_player_card_area, el_player_deck_area, state)

    return true;
}

function handle_reserve_card_drop(target_id, target) {
    const card = state.player_reserve[0];

    if (!is_valid_move(target_id, card, state, target)) return false;

    state[target_id].push(card);
    state.player_reserve.splice(0, 1)

    update_piles(state);
    update_stacks(state);
    update_player_cards(el_player_reserve, el_player_card_area, el_player_deck_area, state)

    return true;
}

function handle_main_card_drop(target_id, target) {
    console.log(target_id, target)
    const card = state.player_deck[state.card_index];

    if (!is_valid_move(target_id, card, state, target)) return false;

    state[target_id].push(card);
    state.player_deck.splice(state.card_index, 1)
    state.card_index--;

    update_piles(state);
    update_stacks(state);
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

// Socket mock
// msg = src -> target -> state_id -> turn_id
// state is to roll_back and to reject all gotten further moves server-side since invalid move
// client sends moves 55 (Invalid), 56 (valid), 57 (valid), server sees 55 invalid and rejects 56, 57

const waiting_moves_confirmation = []

function get_coordinates_for_move(selector) {
    const el = document.querySelector(selector);
    if (!el) console.error(`Err: element ${selector} does not exist {get_coordinates_for_move}`)
    const rect = el.getBoundingClientRect();
    const coords = {
        x: rect.left,
        y: rect.y
    };
    console.log("{get_coordinates_for_move}\n", selector, ": ", rect)

    if (el.classList.contains("pile")) {
        const side = selector[6];

        if (side !== 'r' && side !== 'l') {
            console.error("Err: didnt find pile side {get_coordinates_for_move}");
        }

        if (el.hasChildNodes()) {
            const last_card = el.lastChild;
            const last_card_rect = last_card.getBoundingClientRect();
            coords.x = side === 'l'
                ? last_card_rect.left - (card_width - card_overlap)
                : last_card_rect.right - card_overlap;
            coords.y = last_card_rect.y;
        } else {
            coords.x = side === 'l' ? rect.right - card_width : rect.left;
            coords.y = rect.y;
        }
    }

    return coords;
}

function socket_on_get_move(msg) {
    const [src, target, state_id, turn_id] = msg.split("-");

    if (!src || !target || !state_id || !turn_id) {
        console.error(`Err: socket get, no src/target/state_id/turn_id {socket_on_get_move}: ${msg}`);
        return;
    }

    socket_behaviour_auto_move_card(src, target);
    socket_behaviour_update_state(state, src, target);

    setTimeout(() => {
        update_player_cards(el_player_reserve, el_player_card_area, el_player_deck_area, state)
        update_piles(state);
    }, 400)
}

function create_ghost(x, y, value) {
    const ghost = document.createElement("div");
    ghost.classList.add("card")
    ghost.classList.add("card-up")
    ghost.classList.add("ghosty") // Class for image
    ghost.style.position = "fixed";
    ghost.style.left = x + "px";
    ghost.style.top = y + "px";
    ghost.style.zIndex = "9999";
    ghost.style.transition = "transform 0.4s ease-in-out";
    ghost.textContent = value;
    document.body.appendChild(ghost);
    return ghost;
}

// Todo: match player_card ID and state key
function socket_behaviour_auto_move_card(src, target) {
    const src_coords = get_coordinates_for_move(`#${src}`);
    const target_coords = get_coordinates_for_move(`#${target}`);

    const card_value = state[src].at(-1).split("-")[0]
    const ghost = create_ghost(src_coords.x, src_coords.y, card_value)

    const dx = target_coords.x - src_coords.x;
    const dy = target_coords.y - src_coords.y;

    ghost.getBoundingClientRect();
    ghost.style.transform = `translate(${dx}px, ${dy}px)`;

    ghost.addEventListener('transitionend', (e) => {
        ghost.remove();
    });
}

// Todo: what if src is opponent deck or reserve?
function socket_behaviour_update_state(state, src, target, id) {
    // Just for testing, remove later
    if (src === "player_deck") {
        const src_card = state[src].at(state.card_index);
        state[target].push(src_card);
        state.player_deck.splice(state.card_index, 1)
        state.card_index--;
        return
    }

    if (target === "player_reserve") {
        const target_card = state[target].at(-1);
        state.player_reserve.push(target_card);
        state[target_card].pop()
    }
    else if (target === "player_deck") {
        const src_card = state[src].at(-1);
        state.card_index++;
        arr_insert_at(state[target], state.card_index, src_card);
    }
    else {
        state[target].push(state[src].at(-1));
        state[src].pop();
    }
}

document.addEventListener("keyup", event => {
    if (event.key === "o") {
        socket_on_get_move("p_one_card-pile_r_one-10-1")
    }
    if (event.key === "p") {
        socket_on_get_move("pile_r_two-pile_r_three-10-1")
    }
    if (event.key === "s") {
        console.log(state)
    }
})