let sortedSuits = ['Clubs', 'Diamonds', 'Hearts', 'Spades'];
let sortedRanks = ['Deuce', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King', 'Ace'];

let planes = ['matrix','astral','meatspace'];

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

        this.hands.set(user, this.hands.get(user).concat(newCards));

        if (plane == null) {
            plane = planes[planes.length-1];
        }

        this.planesMap.set(plane, this.planesMap.get(plane).concat(newCards));

        return newCards;
    }

    /**
     * Returns the cards belonging to a given user
     * @param {string} user the player whose hand is to be viewed
     * @returns list of cards belonging to the player
     */
    viewHand(user) {
        console.log(this.hands);
        if (!this.hands.has(user)) {
            return [];
        } else {
            return this.hands.get(user);
        }
    }

    /**
     * Finds a card's plane
     * @param {Card} card the card to locate
     * @returns string identifying the plane in which the card resides, or null if the card has not been drawn
     */
    getPlane(card) {
        console.log(this.planesMap);
        for (let plane of planes) {
            if (this.planesMap.get(plane).includes(card)) {
                return plane;
            }
        }
        return null;
    }

    getCardsByPlane(plane) {
        return this.planesMap.get(plane);
    }

    getHolder(card) {
        for (let user of this.hands.keys()) {
            if (this.hands.get(user).includes(card)) {
                return user;
            }
        }
        return null;
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