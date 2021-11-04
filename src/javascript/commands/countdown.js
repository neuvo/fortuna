const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageButton } = require('discord.js');
const { encodeCustomId, getSendableComponents, cdBackupPath, backupCdPath } = require('../utils/command-utils');
const { theDeck, planes } = require('../utils/playing-cards');
const fs = require("fs");

class Initiative {
    constructor() {
        this.init();
        this.restore();
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

        this.backup();

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

            if (currentCard != null && card.id == currentCard.id) {
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

        let output = null;
        if (this.turnOrder.length != 0) {
            for (let card of this.turnOrder) {
                if (!this.turnHistory.includes(card) && 
                        this.turnOrder.indexOf(card) > this.turnOrder.indexOf(this.getLastCard())) {
                    this.turnHistory.push(card);
                    output = card;
                    break;
                }
            }

            // if hasn't filled output yet, then end of round has been reached
            if (output == null) {
                this.turnHistory = [this.turnOrder[0]];
                output = this.getLastCard();
            }
        }

        this.backup();
        return output;
    }

    prev() {
        this.updateTurnOrder();
        let output = null;
        if (this.turnOrder.length == 0) {
            // do nothing
        } else if (this.turnHistory.length == 0) {
            this.turnHistory = this.turnHistory.concat(this.turnOrder);
            output = this.getLastCard();
        } else {
            output = this.turnHistory.pop();
            if (this.turnHistory.length == 0) {
                this.turnHistory = this.turnHistory.concat(this.turnOrder);
            }
        }

        this.backup();
        return output;
    }

    backup() {
        for (let card of this.turnHistory) {
            if (card.tag != null) {
                card.tag.replaceAll(' ', '_');
            }
        }

        for (let card of this.turnOrder) {
            if (card.tag != null) {
                card.tag.replaceAll(' ', '_');
            }
        }

        fs.writeFile(backupCdPath, JSON.stringify(this), function(err) {
            if (err) {
                console.log(err);
                return console.error(err);
            }
        });
    }

    restore() {
        try {
            let data = fs.readFileSync(backupCdPath);
            if (data != null) {
                data = data.toString();
                let oldCountdown = JSON.parse(data);
                this.turnHistory = theDeck.objectArrToCards(oldCountdown.turnHistory);

                for (let card of this.turnHistory) {
                    if (card.tag != null) {
                        card.tag.replaceAll('_', ' ');
                    }
                }
            }
        } catch (err) {
            console.log(err);
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