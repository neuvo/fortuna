

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
        this.planesMap = new Map();
        this.shuffle();
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
     * Discards a card from the user's hand with the given card ID number
     * @param {string} user Username
     * @param {integer} cardId Card id number to discard
     * @returns none
     */
    discardById(user, cardId) {
        if (this.hands.has(user)) {
            for (let card of this.hands.get(user)) {
                if (card.id == cardId) {
                    this.banish(card);
                    this.hands.get(user).splice(this.hands.get(user).indexOf(card),1);
                    return card;
                }
            }
        }
    }

    /**
     * Discards all cards from user's hand with a tag matching the given tag
     * @param {string} user Username
     * @param {string} tag Tag of cards to discard
     */
    discardByTag(user, tag) {
        let discards = [];
        if (this.hands.has(user)) {
            for (let card of this.hands.get(user)) {
                if (card.tag == tag) {
                    this.banish(card);
                    discards.push(card);
                }
            }
            for (let card of discards) {
                let index = this.hands.get(user).indexOf(card);
                this.hands.get(user).splice(index, 1);
            }
        }
        return discards;
    }

    discard(user) {
        if (this.hands.has(user)) {
            for (let card of this.hands.get(user)) {
                this.banish(card);
            }
            this.hands.delete(user);
        }
    }

    banish(card) {
        for (let plane of this.planesMap.keys()) {
            if (this.planesMap.get(plane).includes(card)) {
                let index = this.planesMap.get(plane).indexOf(card);
                this.planesMap.get(plane).splice(index,1);
            }
        }
    }

    /**
     * Shuffles the deck, clearing all hands and planes and restoring all cards to the deck with tags wiped
     */
    shuffle() {
        this.hands.clear();
        this.initPlanes();
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
        let selfString = '';
        if (this.id >= 52) {
            selfString += ':black_joker:';
        } else {
            selfString += sortedRanks[Math.floor(this.id/4)] + ' of ' + sortedSuits[Math.floor(this.id%4)];
        }

        if (this.tag != null) {
            selfString += ' **' + this.tag + '**';
        }

        return selfString;
    }

    toStringPlain() {
        let selfString = '';
        if (this.id >= 52) {
            selfString += ':black_joker:';
        } else {
            selfString += sortedRanks[Math.floor(this.id/4)] + ' of ' + sortedSuits[Math.floor(this.id%4)];
        }

        if (this.tag != null) {
            selfString += ' (' + this.tag + ')';
        }

        return selfString;
    }
}

exports.theDeck = new Deck();