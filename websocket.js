import {handle_game_start, ws_behaviour_set_player_connection, ws_behaviour_set_room} from "./index.js";
import {state, state_apply_snapshot} from "./state.js";
import {render_all} from "./render.js";

let ws;

ws_connect();

function ws_connect() {
    ws = new WebSocket("ws://localhost:5000/ws");
    ws.onopen = ws_on_open;
    ws.onmessage = ws_on_message;
    ws.onerror = ws_on_error;
    ws.onclose = ws_on_close;
    window.socket = ws;
    console.log(ws)
}

function ws_on_open() {
    ws_behaviour_set_player_connection(1);
    console.log("WS connected");

    ws_create_room();
}

function ws_on_message(event) {
    if (event.data.startsWith("joined_room:"))
    {
        const room_id = event.data.split(":")[1];
        ws_behaviour_set_room(room_id)
        handle_game_start(true);
    } else if (event.data.startsWith("{"))
    {
        const data = JSON.parse(event.data);
        console.log("SNAPSHOT\n", data)
        state_apply_snapshot(data);
        render_all(state);
    }
    console.log("Received message\n", event);
    console.log("Received data\n", event.data);
}

function ws_on_close() {
    ws_behaviour_set_player_connection(0);
    console.log("WS closed");
    setTimeout(ws_connect, 1000);
}

function ws_on_error(err) {
    ws_behaviour_set_player_connection(-1);
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

function ws_create_room() {
    ws_send("create_room");
}

function ws_draw_card() {
    ws_send("draw_card");
}

function ws_join_room(room_id) {
    ws_send("join_room:" + room_id);
}

function ws_send_move(moveObj) {
    ws_send(JSON.stringify(moveObj));
}

export {
    ws,
    ws_send,
    ws_close,
    ws_create_room,
    ws_join_room,
    ws_draw_card,
    ws_send_move
}