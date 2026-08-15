import {pile_names, stack_names} from "./constants.js";
import {
    el_reserve,
    el_deck,
    el_card,
    el_reserve_left,
    el_cards_left,
    el_deck_left,
    el_o_reserve,
    el_o_reserve_left,
    el_o_card,
    el_o_pile_left,
    el_o_deck_left,
    el_o_deck,
    btn_end_turn,
    el_turn_indicator, el_overlay, el_overlay_msg
} from "./elements.js";
import {is_valid_turn_end} from "./validation.js";

function render_player_cards(state) {
    if (state.player_reserve.length > 0) {
        const card = state.player_reserve.at(-1);
        const value = card.split("-")[0]
        el_reserve.dataset.value = value;
        el_reserve.classList.add("pickable");
    } else {
        el_reserve.dataset.value = "-1";
        el_reserve.classList.remove("pickable");
    }

    if (state.player_pile.length > 0) {
        const card = state.player_pile.at(-1);
        const value = card.split("-")[0]
        el_card.dataset.value = value;
        el_card.classList.add("pickable");
    } else {
        el_card.dataset.value = "-1";
        el_card.classList.remove("pickable");
    }

    if (state.player_deck.length > 0) {
        const card = state.player_deck.at(-1);
        const [_, owner] = card.split("-")
        el_deck.dataset.owner = owner;
    } else {
        el_deck.dataset.owner = "-1";
    }

    el_reserve_left.textContent = state.player_cards_len[0];
    el_cards_left.textContent = state.player_cards_len[1];
    el_deck_left.textContent = state.player_cards_len[2];
}

function render_piles(state) {
    for (const pile_id of pile_names) {
        const pile = document.querySelector(`#${pile_id}`);
        pile.innerHTML = "";

        const pile_len = state[pile_id].length-1;

        for (let i = 0; i <= pile_len; i++) {
            const card_info = state[pile_id][i];
            const sample_pile_card = document.createElement("div");
            const value = card_info.split("-")[0];

            sample_pile_card.className = "card pile_left_card card-up";
            sample_pile_card.dataset.value = value
            sample_pile_card.dataset.src = pile_id;
            sample_pile_card.textContent = value;
            if (i === pile_len) sample_pile_card.classList.add("pickable");

            pile.appendChild(sample_pile_card);
        }
    }
}

function render_stacks(state) {
    for (const stack_id of stack_names) {
        const el_stack = document.querySelector(`#${stack_id}`);
        const stack = state[stack_id];
        const last_card = stack.at(-1);

        if (!last_card) {
            delete el_stack.dataset.value;
            continue;
        }

        const value = last_card.split("-")[0]

        el_stack.dataset.value = value;
        el_stack.classList.add("card-up");
    }
}

function render_opponent_cards(state) {
    if (state.opponent_reserve.length > 0) {
        const card = state.opponent_reserve.at(-1);
        const value = card.split("-")[0];
        el_o_reserve.dataset.value = value;
    } else {
        el_o_reserve.dataset.value = "-1";
    }

    if (state.opponent_pile.length > 0) {
        const card = state.opponent_pile.at(-1);
        const value = card.split("-")[0];
        el_o_card.dataset.value = value;
    } else {
        el_o_card.dataset.value = "-1";
    }

    if (state.opponent_deck.length > 0) {
        const card = state.opponent_deck.at(-1);
        const [_, owner] = card.split("-")
        el_o_deck.dataset.owner = owner;
    } else {
        el_o_deck.dataset.owner = "-1";
    }

    el_o_reserve_left.textContent = state.opponent_cards_len[0];
    el_o_pile_left.textContent = state.opponent_cards_len[1];
    el_o_deck_left.textContent = state.opponent_cards_len[2];
}

function render_turn_elements(state) {
    el_turn_indicator.classList.toggle("turn-opponent", state.player_id !== state.turn_player_id);
    btn_end_turn.disabled = !(state.player_id === state.turn_player_id && is_valid_turn_end(state))
}

let overlay_timer = null;

function render_overlay_message_timed(message, time_ms = 1500) {
    if (overlay_timer) clearTimeout(overlay_timer);

    el_overlay.classList.add("ol-on");
    el_overlay_msg.textContent = message;

    overlay_timer = setTimeout(() => {
        el_overlay.classList.remove("ol-on");
        el_overlay_msg.textContent = "";
    }, time_ms)
}

function render_overlay_message(message) {
    if (message === null) {
        el_overlay.classList.remove("ol-on");
        el_overlay_msg.textContent = "";
        el_overlay_msg.classList.remove("connecting");
        return;
    }
    el_overlay.classList.add("ol-on");
    el_overlay_msg.textContent = message;

    if (message.startsWith("Connecting"))
        el_overlay_msg.classList.add("connecting");
}

function render_all(state) {
    render_player_cards(state);
    render_opponent_cards(state);
    render_piles(state);
    render_stacks(state);
    render_turn_elements(state);
}

export {
    render_opponent_cards,
    render_player_cards,
    render_piles,
    render_stacks,
    render_all,
    render_turn_elements,
    render_overlay_message,
    render_overlay_message_timed
}