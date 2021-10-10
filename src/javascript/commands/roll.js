const { SlashCommandBuilder } = require('@discordjs/builders');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Rolls specified dice, as a trait roll by default')
        .addStringOption(option => option.setName('dice')
            .setDescription('Roll the specified dice in the format of <quantity>d<size> repeated, separated by whitespace')
            .setRequired(true))
        .addIntegerOption(option => option.setName('mod')
            .setDescription('Add a fixed number to the results of the roll. Can be positive or negative')
            .setRequired(false))
        .addStringOption(option => option.setName('mode')
            .setDescription('trait rolls take the highest result, damage rolls add all results')
            .setRequired(false)
            .addChoice('damage', 'damage')
            .addChoice('trait', 'trait')),
    async execute(interaction) {
        await interaction.reply(handleRolls(interaction.user.tag, 
            interaction.options.getString('dice'), 
            interaction.options.getString('mode'),
            interaction.options.getInteger('bonus')))
    },
};

/**
 * 
 * @param {string} userTag
 * @param {string} dieStr
 * @param {boolean} isDamage
 * @param {number} bonus
 */
function handleRolls(userTag, diceStr, isDamage, bonus) {
    if (diceStr.length == 0) {
        return 'Invalid input: expecting dice';
    }

    let rollTally = 0;
    
    if (isDamage == null) {
        isDamage = false;
    }

    for (let die of parseDiceStr(diceStr)) {

        console.log("Damage mode: " + isDamage);

        if (die.sides <= 1) {
            return 'Invalid input ' + die.toString() + ': dice must have at least 2 sides';
        }

        let diceResult = rollDice(die, isDamage);

        console.log("Dice result: " + diceResult);
        
        if (isDamage) {
            rollTally += diceResult;
        } else if (diceResult > rollTally) {
            rollTally = diceResult;
        }
    }

    if (bonus != null) {
        rollTally += bonus;
    }

    return userTag + ' rolls ' + rollTally + ' ' + (isDamage ? 'damage' : '');
}

/**
 * 
 * @param {DiceArg} diceArg
 * @param {boolean} isDamage 
 */
function rollDice(diceArg, isDamage) {
    let rollTally = 0;

    let glitch = true;

    let quantity = diceArg.quantity;
    let sides = diceArg.sides;

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

/**
 * Parses a dice string into its component parts; different dice (e.g. 2d8, 1d6)
 * @param {string} diceStr 
 */
function parseDiceStr(diceStr) {
    diceStr = diceStr.trim(); // eliminate beginning and trailing whitespace
    let splitDice = diceStr.split(' ');
    let parsedDiceStr = [];
    for (let split of splitDice) {
        let quantAndSides = split.split('d');
        
        if (quantAndSides.length != 2) {
            console.log("Invalid input " + quantAndSides + "detected, skipping");
            continue;
            // TODO: how to relay to user that this is invalid?
        }

        let quantity = parseInt(quantAndSides[0]);
        let sides = parseInt(quantAndSides[1]);

        parsedDiceStr.push(new DiceArg(quantity, sides));
    }
    return parsedDiceStr;
}

class DiceArg {
    constructor(quantity, sides) {
        this.quantity = quantity;
        this.sides = sides;
    }

    toString() {
        return this.quantity + 'd' + this.sides;
    }
}
