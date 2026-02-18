import {pile_names, stack_names} from "./constants.js";

function update_player_cards(el_player_reserve, el_player_card_area, el_player_deck_area, state) {
    const el_reserve = el_player_reserve.querySelector(".reserve_card");
    const el_card = el_player_card_area.querySelector(".main_card_one");
    const el_deck = el_player_deck_area.querySelector(".main_deck_one");

    const el_reserve_left = el_player_reserve.querySelector(".cards_left");
    const el_cards_left = el_player_card_area.querySelector(".cards_left");
    const el_deck_left = el_player_deck_area.querySelector(".cards_left");

    // Set reserve card
    if (state.player_reserve.length > 0) {
        const card = state.player_reserve[0];
        const value = card.split("-")[0]
        el_reserve.dataset.value = value;
        el_reserve.textContent = value;
        el_reserve_left.textContent = (state.player_reserve.length).toString();
    } else {
        el_reserve.dataset.value = "-1";
        el_reserve.textContent = "";
        el_reserve_left.textContent = "";
    }

    // Set main card
    if (state.card_index >= 0) {
        const card = state.player_deck[state.card_index];
        const value = card.split("-")[0]
        el_card.dataset.value = value;
        el_card.textContent = value;
        el_cards_left.textContent = state.card_index + 1;
    } else {
        el_card.dataset.value = "-1";
        el_card.textContent = "";
        el_cards_left.textContent = "";
    }

    // Set deck
    const cards_in_deck = (state.player_deck.length - (state.card_index + 1))
    if (cards_in_deck > 0) {
        const card = state.player_deck[state.card_index + 1];
        const [_, owner] = card.split("-")
        el_deck.dataset.owner = owner;
        el_deck_left.textContent = cards_in_deck.toString();
    } else {
        el_deck.dataset.owner = "-1";
        el_deck_left.textContent = "";
    }
    console.log(state)
}

function update_piles(state) {
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

function update_stacks(state) {
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
    update_player_cards,
    update_piles,
    update_stacks
}