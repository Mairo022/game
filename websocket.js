import {
    handle_game_start,
    socket_behaviour_auto_move_card,
    ws_behaviour_set_opponent_connection,
    ws_behaviour_set_player_connection,
    ws_behaviour_set_room
} from "./index.js";
import {
    reset_state,
    state,
    state_apply_snapshot,
    state_end_turn,
    state_init_deck_owners,
    state_set_player_id
} from "./state.js";
import {
    render_all,
    render_turn_elements,
    render_opponent_cards,
    render_player_cards,
    render_overlay_message,
    render_overlay_message_timed
} from "./render.js";
import {inp_room_id} from "./elements.js";
import {WS_ADDR} from "./constants.js";

let ws;

ws_connect();

function ws_connect() {
    ws = new WebSocket(WS_ADDR);
    ws.onopen = ws_on_open;
    ws.onmessage = ws_on_message;
    ws.onerror = ws_on_error;
    ws.onclose = ws_on_close;
    window.socket = ws;
    console.log(ws)

    if (inp_room_id.placeholder[0] !== 'R') {
        ws_join_room(inp_room_id.placeholder);
    }
}

function ws_on_open() {
    ws_behaviour_set_player_connection(1);
    render_overlay_message(null);
    console.log("WS connected");
    // Note: auto connect to room
    // ws_create_room();
}

function ws_on_message(event) {
    const msg = JSON.parse(event.data);

    if (msg.Type === "ping") {
        ws_send_no_log("pong");
        return;
    }

    console.log("Received message", event);
    console.log(`Received:\nType = ${msg.Type}; Data = ${JSON.stringify(msg.Data)}`);

    if (msg.Type === "move") {
        msg.Data.Src = msg.Data.Src.replace("player", "opponent");
        msg.Data.Target = msg.Data.Target.replace("opponent", "player");

        socket_behaviour_auto_move_card(msg.Data.Src, msg.Data.Target, state);
        return;
    }

    if (msg.Type === "draw_pile") {
        state.player_pile[0] = msg.Data;
        render_player_cards(state);
    }

    if (msg.Type === "draw_pile_op") {
        state.opponent_pile[0] = msg.Data;
        render_opponent_cards(state);
        return;
    }

    if (msg.Type === "draw_card") {
        const split = msg.Data.split(",");
        state.player_pile[0] = split[0];
        state.player_deck[0] = "x-"+split[1];

        if (state.player_cards_len[2] === 0) {
            state.player_cards_len[2] = state.player_cards_len[1]-1;
            state.player_cards_len[1] = 1;
        } else {
            state.player_cards_len[1]++;
            state.player_cards_len[2]--;
        }
        render_all(state);
        return;
    }

    if (msg.Type === "draw_card_op") {
        const split = msg.Data.split(",");
        state.opponent_pile[0] = split[0];
        state.opponent_deck[0] = "x-"+split[1];

        if (state.opponent_cards_len[2] === 0) {
            state.opponent_cards_len[2] = state.opponent_cards_len[1]-1;
            state.opponent_cards_len[1] = 1;
        } else {
            state.opponent_cards_len[1]++;
            state.opponent_cards_len[2]--;
        }

        render_all(state);
        return;
    }

    if (msg.Type === "draw_reserve") {
        state.player_reserve[0] = msg.Data;
        render_player_cards(state);
    }

    if (msg.Type === "draw_reserve_op") {
        state.opponent_reserve[0] = msg.Data;
        render_opponent_cards(state);
        return;
    }

    if (msg.Type === "end_turn_op") {
        state_end_turn(!state.player_id)
        render_turn_elements(state)
        return;
    }

    if (msg.Type === "snap") {
        state_apply_snapshot(msg.Data);
        render_all(state);
        return;
    }

    if (msg.Type === "op_joined") {
        ws_behaviour_set_opponent_connection(1);
        return;
    }

    if (msg.Type === "op_left") {
        ws_behaviour_set_opponent_connection(0);
        return;
    }

    if (msg.Type === "joined_room") {
        ws_behaviour_set_room(msg.Data.Id);
        state_set_player_id(msg.Data.PlayerId);
        ws_behaviour_set_opponent_connection(msg.Data.OpponentIn);
        return;
    }

    if (msg.Type === "join_room_failed") {
        render_overlay_message_timed("Failed to join room: " + msg.Data)
        console.error("Failed to join room:", msg.Data);
    }

    if (msg.Type === "start") {
        handle_game_start(true);
        state_apply_snapshot(msg.Data);
        state_init_deck_owners()
        render_all(state);
        return;
    }
}

function ws_on_close() {
    console.log("WS closed");
    ws_behaviour_set_player_connection(0);
    ws_behaviour_set_opponent_connection(0);
    reset_state();
    render_all(state);
    render_overlay_message("Connecting to server");
    setTimeout(ws_connect, 2000);
}

function ws_on_error(err) {
    ws_behaviour_set_player_connection(-1);
    ws_behaviour_set_opponent_connection(-1);
    console.error("WS error", err);
}

function ws_close() {
    ws.close();
}

function ws_send(data) {
    if (ws.readyState === WebSocket.OPEN) {
        console.log("Sending\n", data);
        ws.send(data);
    } else {
        console.warn("WS not open");
    }
}

function ws_send_no_log(data) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
    } else {
        console.warn("WS not open");
    }
}

function ws_create_room() {
    ws_send("create_room");
}

function ws_draw_card() {
    ws_send(`{"Type": "draw_card"}`);
}

function ws_join_room(room_id) {
    ws_send("join_room:" + room_id);
}

function ws_send_move(moveObj) {
    ws_send(JSON.stringify(moveObj));
}

function ws_get_snap() {
    ws_send(`{"Type": "get_snap"}`);
}

function ws_end_turn() {
    ws_send(`{"Type": "end_turn"}`);
}

export {
    ws,
    ws_send,
    ws_close,
    ws_create_room,
    ws_join_room,
    ws_draw_card,
    ws_send_move,
    ws_get_snap,
    ws_end_turn
}