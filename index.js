import {pile_names, TARGETS} from "./constants.js"
import {render_piles, render_player_cards, render_stacks} from "./render.js";
import {is_valid_move} from "./validation.js";
import {
    state,
    state_draw_card,
    state_is_deck_empty,
    state_is_player_pile_empty,
    state_move_card,
    state_pile_to_deck
} from "./state.js";
import {
    create_ghost_card_auto_move,
    create_ghost_card_manual_move,
    el_player_card_area, el_player_deck_area,
    el_player_reserve,
    ghost
} from "./elements.js";
import {get_coordinates_for_move} from "./utils.js";

render_player_cards(state)

// Getting new card
el_player_deck_area.addEventListener("click", on_deck_click);

// Moving the cards
let el_pile_areas = pile_names.map(pile => document.getElementById(pile));
let el_main_card = el_player_card_area.querySelector(".main_card_one");
let el_reserve_card = el_player_reserve.querySelector(".reserve_card");
el_pile_areas.forEach(pile => {pile.addEventListener("pointerdown", on_pile_pointer_down)})
el_main_card.addEventListener("pointerdown", on_card_pointer_down);
el_reserve_card.addEventListener("pointerdown", on_card_pointer_down);
el_pile_areas = null;
el_main_card = null;
el_reserve_card = null;

function on_pile_pointer_down(e) {
    const card = e.target
    const value = card.dataset.value;
    const pile_id = card.parentElement.id;
    const rect = card.getBoundingClientRect();

    if (!value || !pile_id) return;

    // Check if clicked on last/pickable card
    const last_pile_value = state[pile_id].at(-1).split("-")[0];
    if (last_pile_value !== value) return;

    create_ghost_card_manual_move(card, {e_x : e.clientX, e_y: e.clientY, r_l: rect.left, r_t: rect.top});
    window.addEventListener("pointermove", on_card_pointer_move);
    window.addEventListener("pointerup", on_card_pointer_up);
}

function on_card_pointer_down(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();

    create_ghost_card_manual_move(card, {e_x : e.clientX, e_y: e.clientY, r_l: rect.left, r_t: rect.top});
    window.addEventListener("pointermove", on_card_pointer_move);
    window.addEventListener("pointerup", on_card_pointer_up);
}

function on_card_pointer_move(e) {
    if (!ghost.el) return;

    ghost.el.style.left = (e.clientX - ghost.offset_x) + "px";
    ghost.el.style.top = (e.clientY - ghost.offset_y) + "px";
}

function on_card_pointer_up(e) {
    if (!ghost.el) return;
    let src;
    let target_type;
    const target = e.target.id || e.target.parentElement?.id;

    if (!target) console.error("Error: drop ID not found");

    if (ghost.el.classList.contains("reserve_card"))
        src = "player_reserve";
    else if (ghost.el.classList.contains("main_card_one"))
        src = "player_pile";
    else if (ghost.el.classList.contains("pile_left_card") || ghost.el.classList.contains("pile_right_card"))
        src = ghost.el.dataset.src;
    else console.error(`Err: invalid ghost class {on_card_pointer_up} \n${ghost.el.classList}`);

    if (e.target.parentElement.classList.contains("pile") || e.target.classList.contains("pile"))
        target_type = TARGETS.pile;
    else if (e.target.classList.contains("stack"))
        target_type = TARGETS.stack;
    else if (e.target.classList.contains("main_card_one"))
        target_type = TARGETS.player_pile;
    else console.error(`Err: invalid drop element class {on_card_pointer_up} \n${e.target?.classList}`);

    if (src && target_type && target) {
        handle_card_drop(src, target, target_type)
    }

    ghost.el.remove();
    ghost.el = null;

    window.removeEventListener("pointermove", on_card_pointer_move);
    window.removeEventListener("pointerup", on_card_pointer_up);
}

function handle_card_drop(src, target, target_type) {
    const card = state[src].at(-1)

    if (!is_valid_move(target, card, state, target_type)) return false;

    state_move_card(src, target);
    render_piles(state);
    render_stacks(state);
    render_player_cards(state)

    return true;
}

function on_deck_click() {
    if (state_is_deck_empty()) {
        if (state_is_player_pile_empty())
            return;
        state_pile_to_deck()
    }

    state_draw_card()
    render_player_cards(state)
}

// Socket mock
// msg = src -> target -> state_id -> turn_id
// state is to roll_back and to reject all gotten further moves server-side since invalid move
// client sends moves 55 (Invalid), 56 (valid), 57 (valid), server sees 55 invalid and rejects 56, 57

const waiting_moves_confirmation = []

function socket_on_get_move(msg) {
    const [src, target, state_id, turn_id] = msg.split("-");

    if (!src || !target || !state_id || !turn_id) {
        console.error(`Err: socket get, no src/target/state_id/turn_id {socket_on_get_move}: ${msg}`);
        return;
    }

    socket_behaviour_auto_move_card(src, target);
    socket_behaviour_update_state(state, src, target);

    setTimeout(() => {
        render_player_cards(state)
        render_piles(state);
    }, 400)
}

// Todo: match player_card ID and state key
function socket_behaviour_auto_move_card(src, target) {
    const src_coords = get_coordinates_for_move(`#${src}`);
    const target_coords = get_coordinates_for_move(`#${target}`);

    const card_value = state[src].at(-1).split("-")[0]
    const ghost = create_ghost_card_auto_move(src_coords.x, src_coords.y, card_value)

    const dx = target_coords.x - src_coords.x;
    const dy = target_coords.y - src_coords.y;

    ghost.getBoundingClientRect();
    ghost.style.transform = `translate(${dx}px, ${dy}px)`;

    ghost.addEventListener('transitionend', (e) => {
        ghost.remove();
    });
}

function socket_behaviour_update_state(state, src, target, id) {
    state_move_card(src, target);
}

document.addEventListener("keyup", event => {
    if (event.key === "o") {
        socket_on_get_move("pile_r_two-pile_r_one-10-1")
    }
    if (event.key === "p") {
        socket_on_get_move("player_pile-pile_r_three-10-1")
    }
    if (event.key === "s") {
        console.log(state)
    }
})