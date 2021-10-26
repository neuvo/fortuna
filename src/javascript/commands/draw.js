const { SlashCommandBuilder } = require('@discordjs/builders');
const { delimiter } = require('../utils/command-utils');
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
            .addChoice(planes[2],planes[2]))
        .addBooleanOption(option => option.setName('ascending')
            .setDescription('Appends ascending numbers to the tag, starting at 1')
            .setRequired(false)),
	async execute(interaction) {
		await interaction.reply(handleDraw(interaction.user.tag, 
            interaction.options.getInteger('number'), 
            interaction.options.getString('tag'),
            interaction.options.getString('plane'),
            interaction.options.getBoolean('ascending')))
	},
};

/**
 * Draws a number of cards for the user
 * @param {String} userName name of the user requesting a draw
 * @param {Number} numCards number of cards to draw
 * @param {String} tag tag the user wishes to apply 
 * @param {Boolean} ascending ascending mode
 */
function handleDraw(userName, numCards, tag, plane, ascending) {
    if (numCards == null) {
        numCards = 1;
    }

    if (plane == null) {
        plane = 'meatspace';
    }

    if (tag != null) {
        tag = tag.replaceAll(delimiter,'');
    }

    let cardsDrawn = theDeck.handleDraw(userName, numCards, tag, plane);

    console.log('Draw results: ' + cardsDrawn);

    let outputMsg = '';

    if (ascending && tag != null) {
        let count = 1;
        for (let card of cardsDrawn) {
            card.tag += ' ' + count.toString();
            count++;
        }
    } else if (ascending) {
        outputMsg += 'No tag supplied, cannot ascend tags\n';
    }

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

    return outputMsg;
}