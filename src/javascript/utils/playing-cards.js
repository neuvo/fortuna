let sortedSuits = ['Clubs', 'Diamonds', 'Hearts', 'Spades'];
let sortedRanks = ['Deuce', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King', 'Ace'];
planes = ['matrix','astral','meatspace'];

exports.planes = planes;

/**
 * Defines and manages the playing card deck structure. There should be only one deck per fortuna instance.
 * There are 54 distinct cards: 
 */
class Deck {
    constructor() {
        this.hands = new Map();
        this.availableCards = [];
        this.shuffle();
        this.planesMap = new Map();
        this.initPlanes();
    }
    
    // private functions

    initPlanes() {
        this.planesMap.clear();
        for (let plane of planes) {
            this.planesMap.set(plane, []);
        }
    }

    /**
     * Draws a number of cards from the deck, up to the number requested. 
     * If fewer cards are returned than requested, then the deck ran out of cards.
     * @param {number} num the number of cards to draw
     * @param {string} tag the tag to apply to all cards; if null, will be left blank
     * @returns array of cards drawn
     */
    drawNum(num, tag) {
        console.log('drawNum: ' + num + ', ' + tag);
        let draws = []
        for (let i = 0; i < num; ++i) {
            console.log('drawing card ' + i);
            if (this.availableCards.length == 0) {
                console.log('out of cards');
                break;
            }

            let index = Math.floor(Math.random()*this.availableCards.length);
            console.log('Random index = ' + index);
            let draw = this.availableCards[index];
            draw.tag = tag;
            this.availableCards.splice(index, 1); // remove one card from available cards
            draws.push(draw);
            console.log('drew a ' + draw.toString());
        }
        return draws;
    }

    /**
     * Shuffles the deck, clearing all hands and planes and restoring all cards to the deck with tags wiped
     */
    shuffle() {
        this.hands.clear();
        this.availableCards.splice(0, this.availableCards.length); // clear the available cards
        for (let id = 0; id < 54; ++id) {
            this.availableCards.push(new Card(id, null));
        }
        console.log(this.availableCards);
    }

    /**
     * Handles the draw, putting new cards in the player's hand and placing them in the appropriate plane
     * @param {string} user the user whose hand will gain the new cards
     * @param {number} num the number of cards to draw
     * @param {string} tag the tag t oapply to all cards; if null, will be left blank
     * @param {string} plane the plane in which the new cards belong
     * @returns array of drawn cards
     */
    handleDraw(user, num, tag, plane) {
        if (num == null) {
            num = 1;
        }
        
        let newCards = this.drawNum(num, tag);
        
        if (!this.hands.has(user)) {
            this.hands.set(user, []);
        }

        this.hands.get(user).concat(newCards);

        if (plane != null) {
            this.planesMap.get(plane).concat(newCards);
        }

        return newCards;
    }
};

class Card {
    constructor(id, tag) {
        this.id = id;
        this.tag = tag;
    }

    toString() {
        console.log('Stringifying id # ' + this.id);
        let selfString = '';
        if (this.id >= 52) {
            selfString += ':black_joker:';
        } else {
            selfString += sortedRanks[this.id % 13] + ' of ' + sortedSuits[Math.floor(this.id / 13)];
        }

        if (this.tag != null) {
            selfString += ' **' + this.tag + '**';
        }

        return selfString;
    }
}

exports.theDeck = new Deck();