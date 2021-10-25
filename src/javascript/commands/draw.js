const { SlashCommandBuilder } = require('@discordjs/builders');
const { Card, theDeck, planes } = require('../utils/playing-cards');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('draw')
		.setDescription('Draw a card from the 54-card deck')
        .addIntegerOption(option => option.setName('number')
            .setDescription('The number of cards to draw. Defaults to 1')
            .setRequired(false))
        .addStringOption(option => option.setName('tag')
            .setDescription('A custom label for all of the cards drawn. If not supplied, the cards will not have a tag')
            .setRequired(false))
        .addStringOption(option => option.setName('plane')
            .setDescription('Defines the plane the card resides in. Defaults to meatspace')
            .setRequired(false)
            .addChoice(planes[0],planes[0])
            .addChoice(planes[1],planes[1])
            .addChoice(planes[2],planes[2])),
	async execute(interaction) {
		await interaction.reply(handleDraw(interaction.user.tag, 
            interaction.options.getInteger('number'), 
            interaction.options.getString('tag'),
            interaction.options.getString('plane')))
	},
};

/**
 * Draws a number of cards for the user
 * @param {string} userName name of the user requesting a draw
 * @param {number} numCards number of cards to draw
 * @param {string} tag tag the user wishes to apply 
 */
function handleDraw(userName, numCards, tag, plane) {
    if (numCards == null) {
        numCards = 1;
    }

    if (plane == null) {
        plane = 'meatspace';
    }

    if (tag != null) {
        tag = tag.replaceAll(/(#|_)/gi,'');
    }

    let cardsDrawn = theDeck.handleDraw(userName, numCards, tag, plane);

    console.log('Draw results: ' + cardsDrawn);

    let outputMsg = '';

    if (cardsDrawn.length < numCards) {
        outputMsg += 'Deck ran out of cards\n'
        return outputMsg;
    }

    outputMsg += userName + ' drew'

    if (cardsDrawn.length == 1) {
        outputMsg += ' ' + cardsDrawn[0].toString() + '\n';
    } else {
        outputMsg += ':\n';
        for (let cardDrawn of cardsDrawn) {
            outputMsg += cardDrawn.toString() + '\n';
        }
    }

    if (cardsDrawn.length > 0) {
        outputMsg += 'New cards sent to ' + plane;
    }

    return outputMsg;
}