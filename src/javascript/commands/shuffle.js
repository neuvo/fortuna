const { SlashCommandBuilder } = require('@discordjs/builders');
const { theDeck } = require('../utils/playing-cards');
const { clearDiscardStacks } = require('./discard');
const { getNickname } = require('../utils/command-utils');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('shuffle')
		.setDescription("Shuffles all players' hands back into the deck"),
	async execute(interaction) {
		await interaction.reply(handleShuffle(getNickname(interaction)));
	},
};

function handleShuffle(username) {
    theDeck.shuffle();
	clearDiscardStacks();
    return username + ' shuffled the deck';
}
