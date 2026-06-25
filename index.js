import {pile_names} from "./constants.js"
import {render_opponent_cards, render_piles, render_player_cards, render_stacks} from "./render.js";
import {is_valid_move} from "./validation.js";
import {
    state,
    state_move_card,
} from "./state.js";
import {
    btn_create_room, btn_join_room,
    create_ghost_card_auto_move,
    el_player_card_area, el_player_deck_area,
    el_player_reserve, el_player_ws_status, el_room_id,
    inp_room_id
} from "./elements.js";
import {get_coordinates_for_move} from "./utils.js";
import {ws_create_room, ws_join_room, ws_send} from "./websocket.js";
import {on_card_pointer_down, on_deck_click, on_pile_pointer_down} from "./events.js";

render_player_cards(state)
render_opponent_cards(state)

inp_room_id.addEventListener("keyup", (e) => {
    btn_join_room.disabled = inp_room_id.value.trim() === "";
})

btn_join_room.addEventListener("click", _ => {
    ws_join_room(inp_room_id.value);
})

btn_create_room.addEventListener("click", _ => {
    ws_create_room()
})

function ws_behaviour_set_room(room_id) {
    el_room_id.textContent = room_id;
}

function ws_behaviour_set_player_connection(is_connected) {
    el_player_ws_status.dataset.connected = is_connected;
}

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

function handle_card_drop(src, target, target_type) {
    const card = state[src].at(-1)

    if (!is_valid_move(target, card, state, target_type)) return false;

    state_move_card(src, target);
    render_piles(state);
    render_stacks(state);
    render_player_cards(state);
    render_opponent_cards(state);

    return true;
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

    const card_value = Array.isArray(state[src]) ? state[src].at(-1).split("-")[0] : state[src].split("-")[0];
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
        ws_send("create_room");
    }
    if (event.key === "i") {
        socket_on_get_move("opponent_pile-pile_r_three-10-1")
    }
    if (event.key === "s") {
        console.log(state)
    }
})

function readTest(data) {
    console.log("From socket", data);
}

export {
    ws_behaviour_set_player_connection,
    ws_behaviour_set_room,
    readTest,
    handle_card_drop
}