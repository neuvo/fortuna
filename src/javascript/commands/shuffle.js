const { SlashCommandBuilder } = require('@discordjs/builders');
const { theDeck } = require('../utils/playing-cards');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('shuffle')
		.setDescription("Shuffles all players' hands back into the deck"),
	async execute(interaction) {
		await interaction.reply(handleShuffle(interaction.user.tag));
	},
};

function handleShuffle(username) {
    theDeck.shuffle();
    return username + ' shuffled the deck';
}
