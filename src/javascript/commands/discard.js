const { SlashCommandBuilder } = require('@discordjs/builders');
const { InteractionResponseType } = require('discord-api-types/v9');
const { MessageActionRow, MessageButton } = require('discord.js');
const { getSendableComponents, encodeCustomId, parseCustomId } = require('../utils/command-utils');
const { theDeck } = require('../utils/playing-cards');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('discard')
		.setDescription('Discards from current hand, or prompts discard dialog. By default, discards your entire hand.')
        .addStringOption(option => option.setName('mode')
            .setDescription('Discards all cards of given tag, or provides a menu of tags/each card')
            .setRequired(false)
            .addChoice('tagmenu', 'tagmenu')
            .addChoice('allmenu','allmenu')),

	async execute(interaction) {
        await interaction.reply({
            components: getDiscardRows(interaction.user.tag, 
                interaction.options.getString('mode')),
            content: handleDiscard(interaction.user.tag, 
                interaction.options.getString('mode')),
            });
	},
};

let discardStacks = new Map();

function clearDiscardStacks() {
    discardStacks = {};
}

function pushDiscards(username, discards) {
    if (discards == null || discards.length == 0) return;
    else if (discardStacks.has(username)) {
        discardStacks.get(username).push(discards);
    } else {
        discardStacks.set(username, [discards]);
    }
}

module.exports.clearDiscardStacks=clearDiscardStacks;

function handleDiscard(username, mode) {
    let usersHand = theDeck.viewHand(username);
    if (usersHand.length == 0) {
        return username + ' has an empty hand';
    } else if (mode == null) {
        console.log('mode is null, discarding entire hand...');
        let outputMsg = username + ' discards:\n';
        for (let card of usersHand) {
            outputMsg += card.toString() + '\n';
        }
        pushDiscards(username, theDeck.discard(username));
        console.log('discarded hand');
        return outputMsg;
    } else if (mode == 'tagmenu') {
        return 'Held tags:';
    } else if (mode == 'allmenu') {
        return 'Held cards:';
    }
}

function getDiscardRows(userName, mode) {
    let discardOptions = [];
    let usersHand = theDeck.viewHand(userName);

    if (usersHand.length == 0) {
        return discardOptions;
    }

    if (mode != null && mode.toLowerCase() == 'allmenu') {
        console.log('allmenu discard mode');
        for (let card of usersHand) {
            discardOptions.push(new MessageButton().setCustomId(encodeCustomId(['discard',userName,'allmenu',card.id.toString()]))
            .setLabel(card.toStringPlain())
            .setStyle('PRIMARY'));
        }
    } else if (mode != null && mode.toLowerCase() == 'tagmenu') {
        console.log('tagmenu discard mode');
        let tagSet = new Set();
        
        for (let card of usersHand) {
            if (card.tag != null) {
                tagSet.add(card.tag);
            }
        }

        for(let tag of tagSet) {
            discardOptions.push(new MessageButton().setCustomId(encodeCustomId(['discard',userName,'tagmenu',tag]))
            .setLabel(tag)
            .setStyle('PRIMARY'));
        }
    }
    
    if (mode == null || discardOptions.length < 25) {
        discardOptions.push(new MessageButton().setCustomId(encodeCustomId(['discard',userName,'undo']))
            .setLabel('Undo')
            .setStyle('DANGER'));
    }
    
    return getSendableComponents(discardOptions);
}

/**
 * Function to handle button responses for discard GUIs
 * @param {MessageComponentInteraction} interaction The interaction
 * @returns Content and components to replace original message with
 */
function respondToDiscard(interaction) {
    let customId = interaction.component.customId;
    let invokingUser = interaction.user.tag;

    let parsedId = parseCustomId(customId);

    console.log('custom id parsed: ' + parsedId);

    let originalUser = parsedId[1];
    let discardMode = parsedId[2];

    if (originalUser != invokingUser) {
        return {
            content: interaction.message.content,
            components: interaction.message.components
        }
    }

    let outContent = '';

    let discards = [];

    if (discardMode == 'tagmenu') {
        discards = theDeck.discardByTag(originalUser, parsedId[3]);
        outContent = 'Discarded all cards with tag ' + parsedId[3];
    } else if (discardMode == 'allmenu') {
        let cardId = parseInt(parsedId[3]);
        discards = [theDeck.discardById(originalUser, cardId)];
        outContent = 'Discarded ' + discards[0].toString() + ' ';
    } else if (discardMode == 'undo') {
        outContent = returnCards(originalUser);
    }

    if (discards.length > 0) {
        if (!discardStacks.has(originalUser)) {
            discardStacks.set(originalUser, [discards]);
        } else {
            discardStacks.get(originalUser).push(discards);
        }
    }

    console.log('discardStacks: ' + discardStacks);

    interaction.component.setDisabled(true);

    if (discardMode == 'undo') {
        for (let actionRow of interaction.message.components) {
            for (let button of actionRow.components) {
                button.setDisabled(false);
            }
        }
    }
    
    return {
        content: outContent, components: interaction.message.components
    };
}

function returnCards(username) {
    if (!discardStacks.has(username)) {
        return username + ' has not discarded any cards';
    }

    let returnedCards = discardStacks.get(username).pop();
    theDeck.giveCards(username, returnedCards);

    let outString = 'Returned ';
    for (let card of returnedCards) {
        outString += card.toString() + ', ';
    }

    if (outString.length > 2) {
        return outString.substring(0, outString.length-2); // trim the last comma and space
    }
}

module.exports.respondToDiscard=respondToDiscard;