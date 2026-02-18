const DECK_SIZE = 52;
const SUITS = ['H', 'D', 'C', 'S']
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
const OWNERS = ['0', '1']


const pile_names = [
    "pile_l_one", "pile_l_two", "pile_l_three", "pile_l_four",
    "pile_r_one", "pile_r_two", "pile_r_three", "pile_r_four"
];

const stack_names = [
    "stack_l_one", "stack_l_two", "stack_l_three", "stack_l_four",
    "stack_r_one", "stack_r_two", "stack_r_three", "stack_r_four"
];

const rank_order = {
    "A": 1,
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    "J": 11,
    "Q": 12,
    "K": 13,
}

const suit_values = {
    "H": 1,
    "D": 1,
    "C": 0,
    "S": 0
}

const TARGETS = {
    stack: 0,
    pile: 1,
    player: 2,
}

export {
    DECK_SIZE,
    SUITS,
    RANKS,
    OWNERS,
    pile_names,
    stack_names,
    rank_order,
    suit_values,
    TARGETS
}