const ghost = {
    el: null,
    offsetX: 0,
    offsetY: 0,
}

const el_player_reserve = document.querySelector("#p_reserve_area")
const el_player_card_area = document.querySelector("#p_pile_area")
const el_player_deck_area = document.querySelector("#p_deck_area")

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
    el_player_card_area
}