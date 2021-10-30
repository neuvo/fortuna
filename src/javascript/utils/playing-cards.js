

let sortedSuits = ['Clubs', 'Diamonds', 'Hearts', 'Spades'];
let sortedRanks = ['Deuce', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King', 'Ace'];

let planes = ['matrix','astral','meatspace'];

let { backupPath: backupPath } = require('../utils/command-utils');

let fs = require('fs');

module.exports.planes = planes;

/**
 * Defines and manages the playing card deck structure. There should be only one deck per fortuna instance.
 * There are 54 distinct cards: 
 */
class Deck {
    constructor() {
        this.dealtCards = [];
        this.availableCards = [];
        this.shuffle();
        this.restore();
    }

    /**
     * Draws a number of cards from the deck, up to the number requested. 
     * If fewer cards are returned than requested, then the deck ran out of cards.
     * @param {number} num the number of cards to draw
     * @param {string} tag the tag to apply to all cards; if null, will be left blank
     * @param {string} plane the plane to apply to all cards
     * @returns array of cards drawn
     */
    drawNum(num, tag, plane) {
        let draws = []
        for (let i = 0; i < num; ++i) {
            if (this.availableCards.length == 0) {
                console.log('out of cards');
                break;
            }

            let index = Math.floor(Math.random()*this.availableCards.length);
            console.log('Random index = ' + index);
            let draw = this.availableCards[index];
            draw.tag = tag;
            draw.plane = plane;
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
     * @returns the discarded card, or null if it doesn't exist
     */
    discardById(user, cardId) {
        for (let card of this.viewHand(user)) {
            if (card.id == cardId) {
                this.dealtCards.splice(this.dealtCards.indexOf(card),1);
                return card;
            }
        }
        this.backup();
        return null;
    }

    /**
     * Discards all cards from user's hand with a tag matching the given tag
     * @param {string} user Username
     * @param {string} tag Tag of cards to discard
     */
    discardByTag(user, tag) {
        let discards = this.getHeldCardsByTag(user, tag);
        for (let card of discards) {
            let index = this.dealtCards.indexOf(card);
            this.dealtCards.splice(index, 1);
        }
        this.backup();
        return discards;
    }

    /**
     * Discards all cards belonging to the cardholder
     * @param {string} user The cardholder
     * @return array of all discarded cards
     */
    discard(user) {
        let discards = this.viewHand(user).splice();
        
        for (let card of discards) {
            let index = this.dealtCards.indexOf(card);
            this.dealtCards.splice(index, 1);
        }

        this.backup();
        return discards;
    }

    /**
     * Searches for a card with the given id in the cardholder's hand
     * @param {string} userName The cardholder
     * @param {int} id The id to search for
     * @returns The card matching the id in the user's hand, if it exists; or null if it doesn't
     */
    getHeldCardById(userName, id) {
        for (let card of this.viewHand(userName)) {
            if (card.id == id) {
                return card;
            }
        }

        return null;
    }

    /**
     * Returns all cards held by a user matching a tag
     * @param {string} username The cardholder
     * @param {string} tag The tag to match
     * @returns Array of matching cards
     */
    getHeldCardsByTag(username, tag) {
        let matchingCards = [];
        for (let card of this.viewHand(username)) {
            if (card.tag.toLowerCase() === tag.toLowerCase()) {
                matchingCards.push(card);
            }
        }
        return matchingCards;
    }

    /**
     * Sends the card with the given id, belonging to the given user name, to the given plane
     * @param {string} userName The cardholder's name
     * @param {int} id The card id to be shifted
     * @param {string} newPlane The plane to send the card to
     * @returns The card that shifted, or null on failure
     */
    planeshiftById(userName, id, newPlane) {
        if (!planes.includes(newPlane)) {
            return null;
        }
        
        let card = this.getHeldCardById(userName, id);
        
        if (card != null) {
            card.plane = newPlane;
        }

        this.backup();
        
        return card;
    }

    /**
     * Shifts all cards belonging to a cardholder and with the given tag to a new plane
     * @param {string} userName The cardholder's name
     * @param {string} tag The tag to be shifted
     * @param {string} newPlane The plane to send cards to
     * @returns Array of cards that successfully made the jump, empty on a failure
     */
    planeshiftByTag(userName, tag, newPlane) {
        if (planes.includes(newPlane)) {
            return [];
        }
        
        let cards = this.getHeldCardsByTag(userName, tag);

        for (let card of cards) {
            card.plane = newPlane;
        }

        this.backup();

        return cards;
    }

    /**
     * Shuffles the deck, clearing all hands and planes and restoring all cards to the deck with tags wiped
     */
    shuffle() {
        this.availableCards.splice(0, this.availableCards.length); // clear the available cards
        for (let id = 0; id < 54; ++id) {
            this.availableCards.push(new Card(id, null));
        }

        this.dealtCards.splice(0, this.dealtCards.length);
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

        if (plane == null) {
            plane = planes[planes.length-1];
        }

        for (let card of newCards) {
            card.plane = plane;
        }
        
        this.giveCards(user, newCards);

        this.backup();

        return newCards;
    }

    /**
     * Gives a set of cards to a user
     * @param {string} user user who shall become cardholder
     * @param {array} cards array of cards to give
     */
    giveCards(user, cards) {
        for (let card of cards) {
            card.holder = user;
        }
        this.dealtCards = this.dealtCards.concat(cards);
        this.backup();
    }

    /**
     * Returns the cards belonging to a given user
     * @param {string} user the player whose hand is to be viewed
     * @returns list of cards belonging to the player
     */
    viewHand(user) {
        let hand = [];

        for (let card of this.dealtCards) {
            if (card.holder === user) {
                hand.push(card);
            }
        }

        return hand;
    }

    getCardsByPlane(plane) {
        let planeCards = [];
        for (let card of this.dealtCards) {
            if (card.plane === plane) {
                planeCards.push(card);
            }
        }
        return planeCards;
    }

    replacer(key, value) {
        if (value instanceof Map) {
            return {
                dataType: 'Map',
                value: Array.from(value.entries()),
            };
        } else {
            return value;
        }
    }

    backup() {
        // need to remove spaces from all tags

        for (let card of this.availableCards) {
            if (card.tag != null) {
                card.tag.replaceAll(' ', '_');
            }
        }

        fs.writeFile(backupPath, JSON.stringify(this, this.replacer), function(err) {
            if (err) {
                console.log(err);
                return console.error(err);
            }
        });
    }

    /**
     * Restores the card objects from backup and copies them into the current hands
     * @param {Map} oldHands The map of strings to objects read from backup file
     */
    restoreCardMap(oldHands) {
        let map = new Map();
        for (let keyValue of oldHands) {
            let key = keyValue[0];
            let oldHand = keyValue[1];

            map.set(key, this.objectArrToCards(oldHand));
        }
        return map;
    }

    objectArrToCards(objectArr) {
        let cards = [];
        for (let object of objectArr) {
            let card = new Card(object.id, object.tag);
            card.plane = object.plane;
            card.holder = object.holder;
            cards.push(card);
        }
        return cards;
    }

    restore() {
        try {
            let data = fs.readFileSync(backupPath);
            if (data != null) {
                data = data.toString();
                let oldDeck = JSON.parse(data);
                // this.hands = this.restoreCardMap(oldDeck.hands.value); // catch these hands
                this.availableCards = this.objectArrToCards(oldDeck.availableCards);
                // this.planesMap = this.restoreCardMap(oldDeck.planesMap.value);
                this.dealtCards = this.objectArrToCards(oldDeck.dealtCards);

                for (let card of this.availableCards) {
                    if (card.tag != null) {
                        card.tag.replaceAll(' ', '_');
                    }
                }
            }
        } catch (err) {
            console.log(err);
        }
    }
};

class Card {
    constructor(id, tag) {
        this.id = id;
        this.tag = tag;
        this.plane = null;
    }

    assign(user) {
        this.holder = user;
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

        if (this.plane != null) {
            selfString += ' _' + this.plane + '_';
        }

        return selfString;
    }

    toStringPlain() {
        let selfString = '';
        if (this.id >= 52) {
            selfString += 'Joker';
        } else {
            selfString += sortedRanks[Math.floor(this.id/4)] + ' of ' + sortedSuits[Math.floor(this.id%4)];
        }

        if (this.tag != null) {
            selfString += ' (' + this.tag + ')';
        }

        return selfString;
    }

    toStringPlainPlane() {
        let selfString = this.toStringPlain();

        if (this.plane != null) {
            selfString += ' [' + this.plane + ']';
        }

        return selfString;
    }

    equals(other) {
        return this.id === other.id && this.tag === other.tag && this.plane === other.plane;
    }
}

exports.theDeck = new Deck();