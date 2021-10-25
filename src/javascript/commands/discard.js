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
        if (interaction.options.getString('mode') == null) {
            await interaction.reply(handleDiscard(interaction.user.tag,
                interaction.options.getString('mode')));
        } else {
            await interaction.reply({
                content: handleDiscard(interaction.user.tag, 
                    interaction.options.getString('mode')),
                components: getDiscardRows(interaction.user.tag, 
                    interaction.options.getString('mode'))
                });
        }
	},
};

function handleDiscard(username, mode) {
    let usersHand = theDeck.viewHand(username);
    if (usersHand.length == 0) {
        return username + ' has an empty hand';
    } else if (mode == null) {
        console.log('mode is null, discarding entire hand...');
        let outputMsg = username + ' discards:\n';
        for (let card of usersHand) {
            outputMsg += card.toString();
            
            let plane = theDeck.getPlane(card);
            if (plane != null) {
                outputMsg += ' _' + plane + '_\n';
            }
        }
        theDeck.discard(username);
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

    if (mode.toLowerCase() == 'allmenu') {
        console.log('allmenu discard mode');
        for (let card of usersHand) {
            discardOptions.push(new MessageButton().setCustomId(encodeCustomId(['discard',userName,'allmenu',card.id.toString()]))
            .setLabel(card.toStringPlain())
            .setStyle('PRIMARY'));
        }
    } else if (mode.toLowerCase() == 'tagmenu') {
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

    let originalUser = parsedId[1];
    let discardMode = parsedId[2];
    let discardTarget = parsedId[3];

    if (originalUser != invokingUser) {
        return {
            content: interaction.message.content,
            components: interaction.message.components
        }
    }

    if (discardMode == 'tagmenu') {
        let tag = discardTarget;
        discards = theDeck.discardByTag(invokingUser, tag);
    } else if (discardMode == 'allmenu') {
        let cardId = parseInt(discardTarget);
        discards = theDeck.discardById(invokingUser, cardId)
    }

    interaction.component.setDisabled(true);
    
    return {
        content: "Discard successful", components: interaction.message.components
    };
}

module.exports.respondToDiscard=respondToDiscard;