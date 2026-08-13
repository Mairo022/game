import {
    state,
    state_disable_card_draw, state_draw_card, state_is_deck_empty, state_is_player_pile_empty, state_pile_to_deck
} from "./state.js";
import {create_ghost_card_manual_move, ghost} from "./elements.js";
import {TARGETS} from "./constants.js";
import {handle_card_drop} from "./index.js";
import {render_player_cards} from "./render.js";
import {ws_draw_card} from "./websocket.js";
import {is_player_turn} from "./validation.js";

function on_deck_click() {
    if (!is_player_turn(state)) return;

    if (state.is_mp)
    {
        ws_draw_card();
        state_disable_card_draw();
        render_player_cards(state)
        return;
    }

    if (state_is_deck_empty()) {
        if (state_is_player_pile_empty())
            return;
        state_pile_to_deck()
    }

    state_disable_card_draw();
    state_draw_card()
    render_player_cards(state)
}

//todo: fix doublecards when picking up text also
function on_pile_pointer_down(e) {
    if (!is_player_turn(state)) return;

    const card = e.target
    const value = card.dataset.value;
    const pile_id = card.parentElement.id;
    const rect = card.getBoundingClientRect();

    if (!value || !pile_id) return;

    // Check if clicked on last/pickable card
    const last_pile_value = state[pile_id].at(-1).split("-")[0];
    if (last_pile_value !== value) return;

    create_ghost_card_manual_move(card, {e_x : e.clientX, e_y: e.clientY, r_l: rect.left, r_t: rect.top});
    window.addEventListener("pointermove", on_card_pointer_move);
    window.addEventListener("pointerup", on_card_pointer_up);
}

function on_card_pointer_move(e) {
    if (!ghost.el) return;

    ghost.el.style.left = (e.clientX - ghost.offset_x) + "px";
    ghost.el.style.top = (e.clientY - ghost.offset_y) + "px";
}

function on_card_pointer_down(e) {
    if (!is_player_turn(state)) return;

    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();

    if (!card.dataset?.value || card.dataset.value === '-1') return;

    create_ghost_card_manual_move(card, {e_x : e.clientX, e_y: e.clientY, r_l: rect.left, r_t: rect.top});
    window.addEventListener("pointermove", on_card_pointer_move);
    window.addEventListener("pointerup", on_card_pointer_up);
}

function on_card_pointer_up(e) {
    if (!ghost.el) return;
    let src;
    let target_type;
    const el_target = document.elementFromPoint(e.clientX, e.clientY).closest(".droppable")

    if (!el_target) {
        window.removeEventListener("pointermove", on_card_pointer_move);
        window.removeEventListener("pointerup", on_card_pointer_up);
        ghost.el.remove();
        ghost.el = null;
        return
    }
    const target = el_target?.id || el_target.parentElement?.id

    if (!target) console.error("Error: drop ID not found");

    if (ghost.el.classList.contains("reserve_card"))
        src = "player_reserve";
    else if (ghost.el.classList.contains("main_card_one"))
        src = "player_pile";
    else if (ghost.el.classList.contains("pile_left_card") || ghost.el.classList.contains("pile_right_card"))
        src = ghost.el.dataset.src;
    else console.error(`Err: invalid ghost class {on_card_pointer_up} \n${ghost.el.classList}`);

    if (el_target.parentElement.classList.contains("pile") || el_target.classList.contains("pile"))
        target_type = TARGETS.pile;
    else if (el_target.classList.contains("stack"))
        target_type = TARGETS.stack;
    else if (el_target.id === "opponent_pile")
        target_type = TARGETS.opponent_pile;
    else if (el_target.id === "opponent_reserve") {
        target_type = TARGETS.opponent_reserve;
    }
    else console.error(`Err: invalid drop element {on_card_pointer_up} \nclass: ${el_target?.classList}, id: ${el_target?.id}`);

    if (src && target_type && target) {
        handle_card_drop(src, target, target_type)
    }

    ghost.el.remove();
    ghost.el = null;

    window.removeEventListener("pointermove", on_card_pointer_move);
    window.removeEventListener("pointerup", on_card_pointer_up);
}

export {
    on_deck_click,
    on_pile_pointer_down,
    on_card_pointer_down,
    on_card_pointer_up,
    on_card_pointer_move,
}
