const { SlashCommandBuilder } = require('@discordjs/builders');
const { InteractionResponseType } = require('discord-api-types/v9');
const { MessageActionRow, MessageButton } = require('discord.js');
const { theDeck } = require('../utils/playing-cards');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('retag')
		.setDescription('Changes the tag of given cards')
        .addStringOption(option => option.setName('newtag')
            .setDescription('Supplies the given tag to selected cards')
            .setRequired(true)),

	async execute(interaction) {
        await interaction.reply({
            content: handleRetag(interaction.options.getString('newtag')),
            components: getRetagButtons(interaction.user.tag, interaction.options.getString('newtag'))
            });
	},
};

function handleRetag(newTag) {
    return 'Applying new tag: ' + newTag;
}


function getRetagButtons(userName, newTag) {
    let retagOptions = [];
    for (let card of theDeck.viewHand(userName)) {
        let label = card.toStringPlain();
        retagOptions.push(new MessageButton().setCustomId('retag'+card.id.toString()+'#'+newTag).setLabel(label).setStyle('PRIMARY'));
    }

    let buttonRows = [];
    let buttonRow = new MessageActionRow();
    let count = 0;
    for (let button of retagOptions) {
        buttonRow.addComponents(button);
        count++;
        if (count == 5) {
            buttonRows.push(buttonRow);
            buttonRow = new MessageActionRow();
            count = 0;
        }
    }

    if (buttonRow.components.length > 0) {
        buttonRows.push(buttonRow);
    }

    return buttonRows;
}

/**
 * Function to handle button responses for discard GUIs
 * @param {MessageComponentInteraction} interaction The interaction
 * @returns Content and components to replace original message with
 */
function respondToRetag(interaction) {
    let customId = interaction.component.customId;
    let userName = interaction.user.tag;

    let cardIdAndTag = customId.substring(5,customId.length);
    let splitIndex = cardIdAndTag.indexOf('#');
    let cardId = parseInt(cardIdAndTag.substring(0,splitIndex));
    let newCardTag = cardIdAndTag.substring(splitIndex+1,cardIdAndTag.length);

    let outputContent = 'Failed to find selected card';

    for (let card of theDeck.viewHand(userName)) {
        if (card.id == cardId) {
            outputContent = 'Re-tagged ' + card.toString() + ' as **' + newCardTag + '**';
            card.tag = newCardTag;
        }
    }

    interaction.component.setDisabled(true);
    
    return {
        content: outputContent, components: interaction.message.components
    };
}

module.exports.respondToRetag=respondToRetag;