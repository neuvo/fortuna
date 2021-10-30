const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const { theDeck } = require('../utils/playing-cards');
const { getNickname } = require('../utils/command-utils');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('hand')
		.setDescription('Shows your current hand'),
	async execute(interaction) {
		await interaction.reply({
            content: handleHand(getNickname(interaction))});
	},
};

function handleHand(username) {
    let usersHand = theDeck.viewHand(username);
    if (usersHand.length == 0) {
        return username + ' has an empty hand';
    } else {
        let outputMsg = username + ' holds:\n';

        for (let card of usersHand) {
            outputMsg += card.toString() + '\n';
        }
        
        return outputMsg;
    }
}