const ghost = {
    el: null,
    offsetX: 0,
    offsetY: 0,
}

// Player elements
const el_player_reserve = document.querySelector("#p_reserve_area")
const el_player_card_area = document.querySelector("#p_pile_area")
const el_player_deck_area = document.querySelector("#p_deck_area")

const el_reserve = el_player_reserve.querySelector("#player_reserve");
const el_card = el_player_card_area.querySelector("#player_pile");
const el_deck = el_player_deck_area.querySelector("#player_deck");

const el_reserve_left = el_player_reserve.querySelector(".cards_left");
const el_cards_left = el_player_card_area.querySelector(".cards_left");
const el_deck_left = el_player_deck_area.querySelector(".cards_left");
//

// Opponent elements
let el_opponent = document.querySelector("#opponent");
const el_o_reserve = el_opponent.querySelector("#opponent_reserve");
const el_o_card = el_opponent.querySelector("#opponent_pile");
const el_o_deck = el_opponent.querySelector("#opponent_deck");
const el_o_reserve_left = el_opponent.querySelector("#o_reserve_area > .cards_left");
const el_o_pile_left = el_opponent.querySelector("#o_pile_area > .cards_left");
const el_o_deck_left = el_opponent.querySelector("#o_deck_area > .cards_left");
//

const btn_create_room = document.querySelector("#create_room");
const el_player_ws_status = document.querySelector("#player_ws_status");
const inp_room_id = document.querySelector("#input_room_id");
const btn_join_room = document.querySelector("#join_room");

const btn_start_sp = document.querySelector("#start_sp");
const btn_get_snap = document.querySelector("#get_snap");
const btn_end_turn = document.querySelector("#end_turn");

const el_turn_indicator = document.querySelector("#indicator_turn");

function create_ghost_card_auto_move(x, y, value) {
    const ghost = document.createElement("div");
    ghost.classList.add("card")
    ghost.classList.add("card-up")
    ghost.classList.add("ghosty") // Class for image
    ghost.style.position = "fixed";
    ghost.style.left = x + "px";
    ghost.style.top = y + "px";
    ghost.style.zIndex = "9999";
    ghost.style.transition = "transform 0.4s ease-in-out";
    ghost.textContent = value;
    document.body.appendChild(ghost);
    return ghost;
}

function create_ghost_card_manual_move(card, position) {
    ghost.offset_x = position.e_x - position.r_l;
    ghost.offset_y = position.e_y - position.r_t;

    ghost.el = card.cloneNode(true);
    ghost.el.style.position = "fixed";
    ghost.el.style.left = position.r_l + "px";
    ghost.el.style.top = position.r_t + "px";
    ghost.el.style.pointerEvents = "none";
    ghost.el.style.zIndex = "9999";

    document.body.appendChild(ghost.el);
}

export {
    ghost,
    create_ghost_card_auto_move,
    create_ghost_card_manual_move,
    el_player_reserve,
    el_player_deck_area,
    el_player_card_area,
    el_reserve,
    el_card,
    el_deck,
    el_deck_left,
    el_cards_left,
    el_reserve_left,
    el_o_reserve,
    el_o_card,
    el_o_deck,
    el_o_pile_left,
    el_o_deck_left,
    el_opponent,
    el_o_reserve_left,
    btn_create_room,
    el_player_ws_status,
    inp_room_id,
    btn_join_room,
    btn_start_sp,
    btn_get_snap,
    btn_end_turn,
    el_turn_indicator
}