const { SlashCommandBuilder } = require('@discordjs/builders');
const { theDeck, planes } = require('../utils/playing-cards');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('countdown')
		.setDescription('It\'s the final...'),
	async execute(interaction) {
		await interaction.reply(handleCountdown());
	},
};

function handleCountdown() {
    let outputMsg = '';

    for (let plane of planes) {
        let planeCards = theDeck.getCardsByPlane(plane);
        if (planeCards.length > 0){
            planeCards.sort();
            outputMsg += '>>>'+plane.toUpperCase()+'<<<\n';
            for(let i = planeCards.length-1; i >= 0; --i) {
                outputMsg += theDeck.getHolder(planeCards[i]) + ' holds ' + planeCards[i].toString() + '\n';
            }
        }
    }

    if (outputMsg.length == 0) {
        outputMsg = 'No cards have been drawn, countdown aborted';
    }
    return outputMsg;
}