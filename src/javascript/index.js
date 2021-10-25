const fs = require('fs');
const { Client, Collection, Intents } = require('discord.js');
const { token } = require('./config.json');
const { respondToDiscard: respondToDiscard } = require('./commands/discard');
const { respondToRetag: respondToRetag } = require('./commands/retag');
const { respondToReroll: respondToReroll } = require('./commands/roll');
const { respondToPlaneshift } = require('./commands/planeshift');

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

client.once('ready', () => {
	console.log('Ready!');
});

client.on('interactionCreate', async interaction => {
	if (interaction.isButton()) {
		console.log("Button pressed");

		if (interaction.component.customId.includes('discard')) {
			return interaction.update(respondToDiscard(interaction));
		} else if (interaction.component.customId.includes('retag')) {
			return interaction.update(respondToRetag(interaction));
		} else if (interaction.component.customId.includes('reroll')) {
			return interaction.update(respondToReroll(interaction));
		} else if (interaction.component.customId.includes('planeshift')) {
			return interaction.update(respondToPlaneshift(interaction));	
		} else {
			return interaction.reply('Unrecognized button: ' + interaction.component.customId);
		}
	} else if (interaction.isCommand()) {
		const command = client.commands.get(interaction.commandName);

		if (!command) return;

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			return interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	} else {
		return "";
	}
});

client.login(token);