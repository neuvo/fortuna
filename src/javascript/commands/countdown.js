const { SlashCommandBuilder } = require('@discordjs/builders');
const { theDeck } = require('../utils/playing-cards');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('countdown')
		.setDescription('It\'s the final...'),
	async execute(interaction) {
		await interaction.reply(interaction.user.tag);
	},
};