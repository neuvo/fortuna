const { SlashCommandBuilder } = require('@discordjs/builders');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Rolls specified dice, as a trait roll by default')
        .addStringOption(option => option.setName('dice')
            .setDescription('Roll the specified dice in the format of <quantity>d<size> repeated, separated by whitespace')
            .setRequired(true))
        .addIntegerOption(option => option.setName('bonus')
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
function handleRolls(userTag, diceStr, mode, bonus) {
    if (diceStr.length == 0) {
        return 'Invalid input: expecting dice';
    }

    if (!bonus) {
        bonus = 0;
    }

    let isDamage = false;

    if (mode != null) {
        isDamage = mode == 'damage';
    }

    let rollTally = 0;

    let output = '';

    for (let die of parseDiceStr(diceStr)) {

        console.log("Damage mode: " + isDamage);

        if (die.sides <= 1) {
            return 'Invalid input ' + die.toString() + ': dice must have at least 2 sides';
        }

        let diceResult = rollDice(die, isDamage);

        output += "Rolling " + die.toString() + ": " + diceResult.toString() + '\n';
        
        if (isDamage) {
            rollTally += diceResult.total;
        } else if (diceResult.total > rollTally) {
            rollTally = diceResult.total;
        }
    }

    if (bonus != null) {
        rollTally += bonus;
    }

    output += userTag + ' rolls ' + (rollTally).toString() + (isDamage ? ' damage' : '');
    if (rollTally == 1 && !isDamage) {
        output += ' **GLITCH**'
    }
    return output;
}

function rollDice(diceArg, isDamage) {
    let rollTally = 0;

    let glitch = true;

    let quantity = diceArg.quantity;
    let sides = diceArg.sides;

    let diceResult = new DiceResult(diceArg);

    for (let i = 0; i < quantity; ++i) {
        console.log("rolling die # " + (i+1));
        let currRollTally = 0;
        do {
            let rollResult = Math.floor(Math.random()*(sides)+1);

            console.log("rolled a " + rollResult.toString());
            
            if (rollResult != 1 || isDamage) {
                glitch = false;
            }

            diceResult.push(rollResult);
            
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

    diceResult.total = rollTally;

    return diceResult;
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
        let quantity = 1;
        let sides = 6;

        if (!isNaN(split)) {
            sides = parseInt(split);
        } else {
            let quantAndSides = split.split('d');
        
            if (quantAndSides.length != 2) {
                console.log("Invalid input " + quantAndSides + " detected, skipping");
                continue;
                // TODO: how to relay to user that this is invalid?
            }

            quantity = parseInt(quantAndSides[0]);
            sides = parseInt(quantAndSides[1]);
        }
        
        parsedDiceStr.push(new DiceArg(quantity, sides));
    }
    return parsedDiceStr;
}

class DiceResult {
    constructor(diceArg) {
        this.arg = diceArg;
        this.results = [];
        this.total = 0;
    }

    push(result) {
        this.results.push(result);
    }

    toString() {
        let output = '';
        for (let result of this.results) {
            output = output + result.toString() + ' ';
        }
        output += '(' + this.total.toString() + ')';
        return output;
    }
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
