const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('hitcount')
		.setDescription("Counts the number of hits and raises given a roll and a target number")
		.addIntegerOption(option => option.setName('roll')
			.setRequired(true)
			.setDescription('The value of the roll'))
		.addIntegerOption(option => option.setName('target')
			.setRequired(true)
			.setDescription('The target number')),
	async execute(interaction) {
		await interaction.reply(handleHitcount(interaction.options.getInteger('roll'),
			interaction.options.getInteger('target')));
	},
};


function handleHitcount(roll, target) {
	let output = '';

	let hit = roll >= target;
	let raises = Math.floor((roll - target) / 4);

	output += 'Roll ' + roll.toString() + ' ';
	if (hit) {
		output += 'hits ';
	} else {
		output += 'misses ';
	}

	output += 'target number ' + target.toString();

	if (raises > 0) {
		output += ' with ' + raises.toString() + ' raise';
		if (raises > 1)
			output += 's';
	}

	return output;
}
