import readTest from "./index.js";

const ws = new WebSocket("ws://localhost:5000/ws");
window.socket = ws; // debugging

ws.addEventListener("open", () => {
    console.log("WS connected");
});

ws.addEventListener("message", (event) => {
    console.log("Received message", event.data);
});

ws.addEventListener("close", () => {
    console.log("WS closed");
});

ws.addEventListener("error", (err) => {
    console.error("WS error", err);
});

function ws_close() {
    ws.close();
}

function ws_send(data) {
    if (ws.readyState === WebSocket.OPEN) {
        readTest("Minuv2rk");
        ws.send(data);
    } else {
        console.warn("[WS] not open");
    }
}

export {
    ws,
    ws_send,
    ws_close,
}
