import {readTest, ws_behaviour_set_player_connection, ws_behaviour_set_room} from "./index.js";

const ws = new WebSocket("ws://localhost:5000/ws");
window.socket = ws; // debugging

ws.addEventListener("open", () => {
    ws_behaviour_set_player_connection(1);
    console.log("WS connected");
});

ws.addEventListener("message", (event) => {
    console.log(event.data)
    if (event.data.startsWith("joined_room:"))
    {
        const room_id = event.data.split(":")[1];
        ws_behaviour_set_room(room_id)
    }
    console.log("Received message", event);
});

ws.addEventListener("close", () => {
    ws_behaviour_set_player_connection(0);
    console.log("WS closed");
});

ws.addEventListener("error", (err) => {
    ws_behaviour_set_player_connection(-1);
    console.error("WS error", err);
});

function ws_close() {
    ws.close();
}

function ws_send(data) {
    if (ws.readyState === WebSocket.OPEN) {
        readTest("read test");
        ws.send(data);
    } else {
        console.warn("WS not open");
    }
}

function ws_create_room() {
    ws.send("create_room");
}

function ws_join_room(room_id) {
    ws.send("join_room:" + room_id);
}

export {
    ws,
    ws_send,
    ws_close,
    ws_create_room,
    ws_join_room,
}
