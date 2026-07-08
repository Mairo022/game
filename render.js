import {pile_names, stack_names} from "./constants.js";
import {
    el_reserve,
    el_deck,
    el_card,
    el_reserve_left,
    el_cards_left,
    el_deck_left,
    el_o_reserve,
    el_o_reserve_left, el_o_card, el_o_pile_left, el_o_deck_left, el_o_deck
} from "./elements.js";

function render_player_cards(state) {
    if (state.player_reserve.length > 0) {
        const card = state.player_reserve.at(-1);
        const value = card.split("-")[0]
        el_reserve.dataset.value = value;
        el_reserve.textContent = value;
    } else {
        el_reserve.dataset.value = "";
        el_reserve.textContent = "";
    }

    if (state.player_pile.length > 0) {
        const card = state.player_pile.at(-1);
        const value = card.split("-")[0]
        el_card.dataset.value = value;
        el_card.textContent = value;
    } else {
        el_card.dataset.value = "-1";
        el_card.textContent = "";
    }

    if (state.player_deck.length > 0) {
        const card = state.player_deck.at(-1);
        const [_, owner] = card.split("-")
        el_deck.dataset.owner = owner;
    } else {
        el_deck.dataset.owner = "-1";
        el_deck.textContent = "";
    }

    el_reserve_left.textContent = state.player_cards_len[0];
    el_cards_left.textContent = state.player_cards_len[1];
    el_deck_left.textContent = state.player_cards_len[2];
}

function render_piles(state) {
    for (const pile_id of pile_names) {
        const pile = document.querySelector(`#${pile_id}`);
        pile.innerHTML = "";

        for (const card_info of state[pile_id]) {
            const sample_pile_card = document.createElement("div");
            const value = card_info.split("-")[0];

            sample_pile_card.className = "card pile_left_card card-up";
            sample_pile_card.dataset.value = value
            sample_pile_card.dataset.src = pile_id;
            sample_pile_card.textContent = value;

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
            el_stack.textContent = "";
            continue;
        }

        const value = last_card.split("-")[0]

        el_stack.dataset.value = value;
        el_stack.textContent = value;
    }
}

function render_opponent_cards(state) {
    if (state.opponent_reserve.length > 0) {
        const card = state.opponent_reserve.at(-1);
        const value = card.split("-")[0];
        el_o_reserve.dataset.value = value;
        el_o_reserve.textContent = value;
    } else {
        el_o_reserve.dataset.value = "-1";
        el_o_reserve.textContent = "";
    }

    if (state.opponent_pile.length > 0) {
        const card = state.opponent_pile.at(-1);
        const value = card.split("-")[0];
        el_o_card.dataset.value = value;
        el_o_card.textContent = value;
    } else {
        el_o_card.dataset.value = "-1";
        el_o_card.textContent = "";
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

function render_all(state) {
    render_player_cards(state);
    render_opponent_cards(state);
    render_piles(state);
    render_stacks(state);
}

export {
    render_opponent_cards,
    render_player_cards,
    render_piles,
    render_stacks,
    render_all
}