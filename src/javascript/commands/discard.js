const { SlashCommandBuilder } = require('@discordjs/builders');
const { InteractionResponseType } = require('discord-api-types/v9');
const { MessageActionRow, MessageButton } = require('discord.js');
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
            discardOptions.push(new MessageButton().setCustomId('discard' + 'allmenu' + card.id.toString())
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
            discardOptions.push(new MessageButton().setCustomId('discard' + 'tagmenu' + tag)
            .setLabel(tag)
            .setStyle('PRIMARY'));
        }
    }

    console.log("preparing " + discardOptions.length + " buttons");
    let discardRows = [];
    let discardRow = new MessageActionRow();
    let count = 0;
    for (let button of discardOptions) {
        discardRow.addComponents(button);
        count++;
        if (count == 5) {
            discardRows.push(discardRow);
            discardRow = new MessageActionRow();
            count = 0;
        }
    }

    if (discardRow.components.length > 0) {
        discardRows.push(discardRow);
    }
    
    return discardRows;
}

/**
 * Function to handle button responses for discard GUIs
 * @param {MessageComponentInteraction} interaction The interaction
 * @returns Content and components to replace original message with
 */
function respondToDiscard(interaction) {
    let customId = interaction.component.customId;
    let userName = interaction.user.tag;
    let tagMenu = customId.toLowerCase().includes('tagmenu');
    let allMenu = customId.toLowerCase().includes('allmenu');

    if (tagMenu) {
        let tag = customId.substring(14);
        discards = theDeck.discardByTag(userName, tag);
    } else if (allMenu) {
        let cardId = parseInt(customId.substring(14));
        discards = theDeck.discardById(userName, cardId)
    }

    interaction.component.setDisabled(true);
    
    return {
        content: "Discard successful", components: interaction.message.components
    };
}

module.exports.respondToDiscard=respondToDiscard;