const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const { theDeck } = require('../utils/playing-cards');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('hand')
		.setDescription('Shows your current hand'),
	async execute(interaction) {
		await interaction.reply({
            content: handleHand(interaction.user.tag)});
	},
};

function handleHand(username) {
    let usersHand = theDeck.viewHand(username);
    if (usersHand.length == 0) {
        return username + ' has an empty hand';
    } else {
        let outputMsg = username + ' holds:\n';
        for (let card of usersHand) {
            outputMsg += card.toString();
            
            let plane = theDeck.getPlane(card);
            if (plane != null) {
                outputMsg += ' _' + plane + '_\n';
            }
        }
        return outputMsg;
    }
}