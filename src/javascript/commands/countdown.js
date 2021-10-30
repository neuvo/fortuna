const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageButton } = require('discord.js');
const { encodeCustomId, getSendableComponents, cdBackupPath } = require('../utils/command-utils');
const { theDeck, planes } = require('../utils/playing-cards');

class Initiative {
    constructor() {
        this.init();
    }

    init() {
        this.turnHistory = [];
        this.turnOrder = [];
    }

    resetTurnOrder() {
        this.init();

        for (let plane of planes) {
            let planeCards = theDeck.getCardsByPlane(plane);
            if (planeCards.length > 0){
                planeCards.sort(function(cardA, cardB) {
                    return cardB.id - cardA.id;
                });
            }
            this.turnOrder = this.turnOrder.concat(planeCards);
        }

        return this.toString();
    }

    updateTurnOrder() {
        // capture the current card before wiping
        let currentCard = this.getLastCard();

        this.resetTurnOrder();

        // problem: edge case where all cards following the last discarded card are discarded
        
        if (currentCard != null) {
            for (let card of this.turnOrder) {
                this.turnHistory.push(card);
                let planeCompare = this.comparePlanes(card.plane, currentCard.plane);
                if (planeCompare > 0)
                    break;
                else if (planeCompare == 0 && card.id <= currentCard.id) {
                    break;
                }
            }
        }

        return this.toString();
    }

    comparePlanes(planeA, planeB) {
        return planes.indexOf(planeA) - planes.indexOf(planeB);
    }

    toString() {
        if (this.turnOrder.length == 0) {
            return 'No cards in countdown';
        }

        let currplane = this.turnOrder[0].plane;

        let outstring = this.getPlaneString(currplane);

        let currentCard = this.getLastCard();

        for (let card of this.turnOrder) {
            if (card.plane != currplane) {
                currplane = card.plane;
                outstring += this.getPlaneString(currplane);
            }

            if (card == currentCard) {
                outstring += '**>>>** ';
            }

            outstring += card.holder + ' holds ' + card.toString() + '\n';
        }

        return outstring;
    }

    getPlaneString(plane) {
        return '<<<' + plane.toUpperCase() + '>>>\n'
    }

    /**
     * Returns the last card to take a turn
     * @returns the last card to take a turn
     */
    getLastCard() {
        if (this.turnHistory.length == 0) {
            return null;
        } else {
            return this.turnHistory[this.turnHistory.length-1];
        }
    }

    next() {
        this.updateTurnOrder();
        if (this.turnOrder.length == 0) {
            return null;
        }

        for (let card of this.turnOrder) {
            if (!this.turnHistory.includes(card) && 
                    this.turnOrder.indexOf(card) > this.turnOrder.indexOf(this.getLastCard)) {
                this.turnHistory.push(card);
                return card;
            }
        }

        // if hasn't returned yet, then end of round has been reached
        this.turnHistory = [this.turnOrder[0]];
        return this.turnOrder[0];
    }

    prev() {
        this.updateTurnOrder();
        if (this.turnOrder.length == 0) {
            return null;
        } else if (this.turnHistory.length == 0) {
            let card = this.turnOrder[this.turnOrder.length-1];
            this.turnHistory = this.turnHistory.concat(this.turnOrder);
            return card;
        } else {
            let output = this.turnHistory.pop();
            if (this.turnHistory.length == 0) {
                this.turnHistory = this.turnHistory.concat(this.turnOrder);
            }
            return output;
        }
    }

}

let turntracker = new Initiative();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('countdown')
		.setDescription('It\'s the final...'),
	async execute(interaction) {
		await interaction.reply({
            content: handleCountdown(),
            components: getControls()
        });
	},
};

function handleCountdown() {
    return turntracker.resetTurnOrder();
}

function getControls() {
    let controlButtons = [];
    
    if (turntracker.turnOrder.length == 0) {
        return controlButtons;
    }

    controlButtons.push(new MessageButton().setCustomId(encodeCustomId('countdownnext'))
        .setLabel('Next')
        .setStyle('SECONDARY'));
    controlButtons.push(new MessageButton().setCustomId(encodeCustomId('countdownprev'))
        .setLabel('Prev')
        .setStyle('SECONDARY'));
    controlButtons.push(new MessageButton().setCustomId(encodeCustomId('countdownupdate'))
        .setLabel('Update')
        .setStyle('PRIMARY'));
    controlButtons.push(new MessageButton().setCustomId(encodeCustomId('countdownreset'))
        .setLabel('Reset')
        .setStyle('DANGER'));
    
    return getSendableComponents(controlButtons);
}

/**
 * Handles countdown control key press
 * @param {MessageComponentInteraction} interaction The triggering interaction
 */
function respondToCountdown(interaction) {
    let outContent = interaction.message.content;
    let pressedLabel = interaction.component.label.toLowerCase();

    if (pressedLabel == 'next') {
        turntracker.next();
    } else if (pressedLabel == 'prev') {
        turntracker.prev();
    } else if (pressedLabel == 'update') {
        outContent = turntracker.updateTurnOrder();
    } else if (pressedLabel == 'reset') {
        outContent = turntracker.resetTurnOrder();
    }

    outContent = turntracker.toString();

    return {
        content: outContent, 
        components: interaction.message.components
    };
}

module.exports.respondToCountdown=respondToCountdown;