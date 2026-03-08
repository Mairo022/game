import {pile_names, stack_names} from "./constants.js";

function render_player_cards(el_player_reserve, el_player_card_area, el_player_deck_area, state) {
    const el_reserve = el_player_reserve.querySelector("#player_reserve");
    const el_card = el_player_card_area.querySelector("#player_pile");
    const el_deck = el_player_deck_area.querySelector("#player_deck");

    const el_reserve_left = el_player_reserve.querySelector(".cards_left");
    const el_cards_left = el_player_card_area.querySelector(".cards_left");
    const el_deck_left = el_player_deck_area.querySelector(".cards_left");

    // Set reserve card
    if (state.player_reserve.length > 0) {
        const card = state.player_reserve.at(-1);
        const value = card.split("-")[0]
        el_reserve.dataset.value = value;
        el_reserve.textContent = value;
        el_reserve_left.textContent = (state.player_reserve.length).toString();
    } else {
        el_reserve.dataset.value = "-1";
        el_reserve.textContent = "";
        el_reserve_left.textContent = "";
    }

    if (state.player_pile.length > 0) {
        const card = state.player_pile.at(-1);
        const value = card.split("-")[0]
        el_card.dataset.value = value;
        el_card.textContent = value;
        el_cards_left.textContent = state.player_pile.length;
    } else {
        el_card.dataset.value = "-1";
        el_card.textContent = "";
        el_cards_left.textContent = "";
    }

    // Set deck
    if (state.player_deck.length > 0) {
        const card = state.player_deck.at(-1);
        const [_, owner] = card.split("-")
        el_deck.dataset.owner = owner;
        el_deck_left.textContent = state.player_deck.length.toString();
    } else {
        el_deck.dataset.owner = "-1";
        el_deck_left.textContent = "";
    }
}

function render_piles(state) {
    for (const pile_id of pile_names) {
        const pile = document.querySelector(`#${pile_id}`);
        pile.innerHTML = "";

        for (const card_info of state[pile_id]) {
            const sample_pile_card = document.createElement("div"); // create new div each time
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

        if (!last_card) continue;

        const value = last_card.split("-")[0]

        el_stack.dataset.value = value;
        el_stack.textContent = value;
    }
}

export {
    render_player_cards,
    render_piles,
    render_stacks
}