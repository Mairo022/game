import {card_overlap, card_width, rank_order, suit_values} from "./constants.js";

function create_card_obj(card) {
    if (!card) return null;

    const [card_value, owner] = card.split("-")
    const card_suit = card_value[0]
    const card_rank = card_value.slice(1)

    return {
        suit: card_suit,
        rank: card_rank,
        rank_value: rank_order[card_rank],
        suit_value: suit_values[card_suit],
        owner: owner,
    }
}

function arr_insert_at(array, index, ...elementsArray) {
    array.splice(index, 0, ...elementsArray);
}

function get_coordinates_for_move(selector) {
    const el = document.querySelector(selector);
    if (!el) console.error(`Err: element ${selector} does not exist {get_coordinates_for_move}`)
    const rect = el.getBoundingClientRect();
    const coords = {
        x: rect.left,
        y: rect.y
    };
    console.log("{get_coordinates_for_move}\n", selector, ": ", rect)

    if (el.classList.contains("pile")) {
        const side = selector[6];

        if (side !== 'r' && side !== 'l') {
            console.error("Err: didnt find pile side {get_coordinates_for_move}");
        }

        if (el.hasChildNodes()) {
            const last_card = el.lastChild;
            const last_card_rect = last_card.getBoundingClientRect();
            coords.x = side === 'l'
                ? last_card_rect.left - (card_width - card_overlap)
                : last_card_rect.right - card_overlap;
            coords.y = last_card_rect.y;
        } else {
            coords.x = side === 'l' ? rect.right - card_width : rect.left;
            coords.y = rect.y;
        }
    }

    return coords;
}

export {
    create_card_obj,
    arr_insert_at,
    get_coordinates_for_move
}