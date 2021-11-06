const { SlashCommandBuilder } = require('@discordjs/builders');
const { InteractionResponseType } = require('discord-api-types/v9');
const { MessageActionRow, MessageButton } = require('discord.js');
const { theDeck } = require('../utils/playing-cards');
const { encodeCustomId, parseCustomId, getSendableComponents, getNickname } = require('../utils/command-utils');

let defaultMode = 'allmenu';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('planeshift')
		.setDescription('Moves cards between planes')
        .addStringOption(option => option.setName('plane')
            .setDescription('The plane to shift cards into')
            .setRequired(true)
            .addChoice('matrix','matrix')
            .addChoice('astral','astral')
            .addChoice('meatspace','meatspace'))
        .addStringOption(option => option.setName('mode')
            .setDescription('Decide whether to shift cards by rank/suit or by tag')
            .setRequired(false)
            .addChoice('tagmenu','tagmenu')
            .addChoice('allmenu','allmenu')),

	async execute(interaction) {
        await interaction.reply({
            content: handlePlaneshift(interaction.options.getString('plane')),
            components: getPlaneshiftButtons(getNickname(interaction), 
                interaction.options.getString('plane'), 
                interaction.options.getString('mode'))
            });
	},
};

function handlePlaneshift(newPlane) {
    return 'Select cards to shift to ' + newPlane;
}

function getPlaneshiftId(userName, shiftTarget, newPlane, mode) {
    return encodeCustomId('planeshift', userName, shiftTarget, newPlane, mode);
}

function getPlaneshiftButtons(userName, newPlane, mode) {
    let shiftOptions = [];

    if (mode == null) {
        mode = defaultMode;
    }

    if (mode == 'allmenu') {
        for (let card of theDeck.viewHand(userName)) {
            let label = card.toStringPlain();
            shiftOptions.push(new MessageButton().setCustomId(getPlaneshiftId(userName, card.id, newPlane, mode)).setLabel(label).setStyle('SECONDARY'));
        }
    } else if (mode == 'tagmenu') {
        let tagSet = new Set();
        for (let card of theDeck.viewHand(userName)) {
            if (card.tag != null) {
                tagSet.add(card.tag);
            }
        }

        for (let tag of tagSet) {
            shiftOptions.push(new MessageButton().setCustomId(getPlaneshiftId(userName, tag, newPlane, mode)).setLabel(tag).setStyle('SECONDARY'));
        }
    }

    return getSendableComponents(shiftOptions);
}

/**
 * Function to handle button responses for discard GUIs
 * @param {MessageComponentInteraction} interaction The interaction
 * @returns Content and components to replace original message with
 */
function respondToPlaneshift(interaction) {
    let invokedUser = getNickname(interaction); // user who pressed the button

    let parsedId = parseCustomId(interaction.component.customId);

    let originalUser = parsedId[1];
    let option = parsedId[2];
    let newPlane = parsedId[3];
    let mode = parsedId[4];

    // only let the cardholder planeshift these cards
    if (originalUser != invokedUser) {
        return {
            content: interaction.message.content, 
            components: interaction.message.components
        };
    }

    let shiftedCards = [];
    if (mode == 'allmenu') {
        let shiftedCard = theDeck.planeshiftById(originalUser, parseInt(option), newPlane);
        if (shiftedCard != null) {
            shiftedCards.push(shiftedCard);
        }
    } else {
        shiftedCards = theDeck.planeshiftByTag(originalUser, option, newPlane);
    }

    let outputContent = interaction.message.content;

    for (let shiftedCard of shiftedCards) {
        outputContent += '\nSent ' + shiftedCard.toStringNoPlane() + ' to ' + newPlane;
    }

    if (shiftedCards.length == 0) {
        outputContent += '\nFailed to shift cards'
    }

    interaction.component.setDisabled(true);
    
    return {
        content: outputContent, 
        components: interaction.message.components
    };
}

module.exports.respondToPlaneshift=respondToPlaneshift;