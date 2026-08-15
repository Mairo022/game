import {pile_names} from "./constants.js"
import {render_all, render_turn_elements} from "./render.js";
import {is_player_turn, is_valid_move, is_valid_turn_end} from "./validation.js";
import {
    reset_state,
    state, state_allow_draw_card, state_end_turn, state_init_decks,
    state_move_card, state_move_card_mp,
} from "./state.js";
import {
    btn_create_room, btn_end_turn, btn_fix_game, btn_join_room, btn_start_sp,
    create_ghost_card_auto_move,
    el_player_card_area, el_player_deck_area,
    el_player_reserve, el_player_ws_status,
    inp_room_id
} from "./elements.js";
import {create_move_obj, get_coordinates_for_move} from "./utils.js";
import {ws_create_room, ws_end_turn, ws_get_snap, ws_join_room, ws_send, ws_send_move} from "./websocket.js";
import {on_card_pointer_down, on_deck_click, on_pile_pointer_down} from "./events.js";

btn_end_turn.addEventListener("click", _ => {
    console.log("end_turn clicked", state);

    if (!is_player_turn(state)) return;
    if (!is_valid_turn_end(state)) return;
    ws_end_turn();
    state_end_turn(state.player_id);
    render_turn_elements(state);
})

btn_fix_game.addEventListener("click", _ => {
    ws_get_snap();
    document.querySelectorAll(".ghost")
        .forEach(el => {el.remove()});
})

btn_start_sp.addEventListener("click", (e) => {
    handle_game_start(false);
})

inp_room_id.addEventListener("keyup", _ => {
    btn_join_room.disabled = inp_room_id.value.trim() === "";
})

btn_join_room.addEventListener("click", _ => {
    ws_join_room(inp_room_id.value);
})

btn_create_room.addEventListener("click", _ => {
    ws_create_room()
})

function ws_behaviour_set_room(room_id) {
    inp_room_id.value = "";
    inp_room_id.placeholder = room_id;
}

function ws_behaviour_set_player_connection(is_connected) {
    el_player_ws_status.dataset.connected = is_connected;
}

function ws_behaviour_draw_card_player(card) {
    state.player_pile.push(card);
    state.player_cards_len[1]++;
    state.player_cards_len[2]--;
}

function ws_behaviour_draw_card_opponent(card) {
    state.player_pile.push(card);
    state.player_cards_len[1]++;
    state.player_cards_len[2]--;
}

// Getting new card
el_player_deck_area.addEventListener("click", on_deck_click);

// Moving the cards
pile_names.map(pile => document.getElementById(pile)).forEach(pile => {pile
    .addEventListener("pointerdown", on_pile_pointer_down)});
el_player_card_area.querySelector(".main_card_one")
    .addEventListener("pointerdown", on_card_pointer_down);
el_player_reserve.querySelector(".reserve_card")
    .addEventListener("pointerdown", on_card_pointer_down);

function handle_game_start(is_mp) {
    reset_state()

    if (is_mp) {
        state.is_mp = true;
    } else {
        state.is_mp = false;
        state_init_decks();
    }
    console.log(state)
    render_all(state);
}

function handle_card_drop(src, target, target_type) {
    const card = state[src].at(-1)

    if (!is_valid_move(target, card, state, target_type)) return false;
    if (src === "player_pile") state_allow_draw_card();

    if (state.is_mp) {
        state_move_card_mp(src, target);
        ws_send_move(create_move_obj(src, target))
    } else state_move_card(src, target);

    render_all(state);

    return true;
}

function socket_on_get_move(msg) {
    const [src, target, state_id, turn_id] = msg.split("-");

    if (!src || !target || !state_id || !turn_id) {
        console.error(`Err: socket get, no src/target/state_id/turn_id {socket_on_get_move}: ${msg}`);
        return;
    }

    socket_behaviour_auto_move_card(src, target, state);
}

function socket_behaviour_auto_move_card(src, target, state) {
    const src_coords = get_coordinates_for_move(`#${src}`);
    const target_coords = get_coordinates_for_move(`#${target}`);

    const card_value = state[src].at(-1).split("-")[0];
    const ghost = create_ghost_card_auto_move(src_coords.x, src_coords.y, card_value)

    const dx = target_coords.x - src_coords.x;
    const dy = target_coords.y - src_coords.y;

    ghost.getBoundingClientRect();
    ghost.style.transform = `translate(${dx}px, ${dy}px)`;

    state_move_card_mp(src, target);

    ghost.addEventListener('transitionend', () => {
        ghost.remove();
        render_all(state);
    });
}


document.addEventListener("keyup", event => {
    if (event.key === "o") {
        socket_on_get_move("pile_r_two-pile_r_one-10-1")
    }
    if (event.key === "p") {
        socket_on_get_move("player_pile-pile_r_three-10-1")
    }
    if (event.key === "i") {
        socket_on_get_move("opponent_pile-pile_r_three-10-1")
    }
    if (event.key === "s") {
        console.log(state)
    }
})

export {
    ws_behaviour_set_player_connection,
    ws_behaviour_set_room,
    handle_card_drop,
    handle_game_start,
    socket_behaviour_auto_move_card
}