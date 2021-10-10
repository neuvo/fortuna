const { SlashCommandBuilder } = require('@discordjs/builders');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Rolls specified dice, as a trait roll by default')
        .addStringOption(option => option.setName('dice')
            .setDescription('Roll the specified dice in the format of <quantity>d<size>')
            .setRequired(true))
        .addStringOption(option => option.setName('mode')
            .setDescription('trait rolls take the highest result, damage rolls add all results')
            .setRequired(false)
            .addChoice('damage', 'damage')
            .addChoice('trait', 'trait')),
    async execute(interaction) {
        await interaction.reply(handleRolls(interaction.user.tag, 
            interaction.options.getString('dice'), 
            interaction.options.getString('mode')))
    },
};

/**
 * 
 * @param {string} userTag
 * @param {string} dieStr
 * @param {boolean} isDamage
 */
function handleRolls(userTag, dieStr, isDamage) {
    if (dieStr.length == 0) {
        return 'Invalid input: expecting dice';
    }
    
    let quantAndSides = dieStr.split('d');
    
    if (quantAndSides.length != 2) {
        return 'Invalid input: expecting <quantity>d<sides>';
    }

    let quantity = parseInt(quantAndSides[0]);
    let sides = parseInt(quantAndSides[1]);

    console.log("rolling " + quantity + "d" + sides);

    if (isDamage == null) {
        isDamage = false;
    }

    console.log("Damage mode: " + isDamage);

    if (sides <= 1) {
        return 'Invalid input: dice must have at least 2 sides';
    }

    let rollTally = rollDice(quantity, sides, isDamage);

    return userTag + ' rolls ' + rollTally + ' ' + (isDamage ? 'damage' : '');
}

/**
 * 
 * @param {number} quantity 
 * @param {number} sides 
 * @param {boolean} isDamage 
 */
function rollDice(quantity, sides, isDamage) {
    let rollTally = 0;

    let glitch = true;

    for (let i = 0; i < quantity; ++i) {
        console.log("rolling die # " + (i+1));
        let currRollTally = 0;
        do {
            let rollResult = Math.floor(Math.random()*sides)+1;

            console.log("rolled a " + rollResult);
            
            if (rollResult != 1) {
                glitch = false;
            }
            
            currRollTally += rollResult;
        } while (currRollTally % sides == 0);

        console.log("Sub tally: " + currRollTally);

        if (isDamage) {
            rollTally += currRollTally;
        } else if (currRollTally > rollTally) {
            rollTally = currRollTally;
        }

        console.log("Running tally: " + rollTally);
    }

    console.log("Glitched? " + glitch);

    return rollTally;
}
