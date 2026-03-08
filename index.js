import {pile_names, stack_names, TARGETS} from "./constants.js"
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


const card_width = document.querySelector(".card").getBoundingClientRect().width;
const card_overlap = 75;

const el_player_reserve = document.querySelector("#p_reserve_area")
const el_player_card_area = document.querySelector("#p_pile_area")
const el_player_deck_area = document.querySelector("#p_deck_area")

render_player_cards(el_player_reserve, el_player_card_area, el_player_deck_area, state)

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
    let src;
    let target_type;
    const target = e.target.id || e.target.parentElement?.id;

    if (!target) console.error("Error: drop ID not found");

    if (ghost.classList.contains("reserve_card"))
        src = "player_reserve";
    else if (ghost.classList.contains("main_card_one"))
        src = "player_pile";
    else if (ghost.classList.contains("pile_left_card") || ghost.classList.contains("pile_right_card"))
        src = ghost.dataset.src;
    else console.error(`Err: invalid ghost class {on_card_pointer_up} \n${ghost?.classList}`);

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

    ghost.remove();
    ghost = null;

    window.removeEventListener("pointermove", on_card_pointer_move);
    window.removeEventListener("pointerup", on_card_pointer_up);
}

function handle_card_drop(src, target, target_type) {
    const card = state[src].at(-1)

    if (!is_valid_move(target, card, state, target_type)) return false;

    state_move_card(src, target);
    render_piles(state);
    render_stacks(state);
    render_player_cards(el_player_reserve, el_player_card_area, el_player_deck_area, state)

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
    if (state_is_deck_empty()) {
        if (state_is_player_pile_empty())
            return;
        state_pile_to_deck()
    }

    state_draw_card()
    render_player_cards(el_player_reserve, el_player_card_area, el_player_deck_area, state)
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
        render_player_cards(el_player_reserve, el_player_card_area, el_player_deck_area, state)
        render_piles(state);
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