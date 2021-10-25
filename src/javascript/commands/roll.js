const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageButton, MessageActionRow } = require('discord.js');
const { parseCustomId, encodeCustomId } = require('../utils/command-utils');

let diceRegEx = /(\d+d\d+|(?<=\s)\d(?=[^d]))/gi;
let bonusRegEx = /[+-]\d([^d]|\b)/gi;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Rolls specified dice, as a trait roll by default')
        .addStringOption(option => option.setName('dice')
            .setDescription('Roll the specified dice and add given bonuses')
            .setRequired(true))
        .addIntegerOption(option => option.setName('bonus')
            .setDescription('Add a fixed positive or negative number to the results of the roll')
            .setRequired(false))
        .addStringOption(option => option.setName('mode')
            .setDescription('trait rolls take the highest result, damage rolls add all results')
            .setRequired(false)
            .addChoice('damage', 'damage')
            .addChoice('trait', 'trait')),
    async execute(interaction) {
        await interaction.reply({
            content: handleRolls(interaction.user.tag, 
                interaction.options.getString('dice'), 
                interaction.options.getString('mode'),
                interaction.options.getInteger('bonus')),
            components: getRerollButtons(interaction.user.tag, 
                interaction.options.getString('dice'), 
                interaction.options.getString('mode'),
                interaction.options.getInteger('bonus'))
        });
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

    diceStr = ' ' + diceStr + ' ';

    let bonusList = diceStr.match(bonusRegEx);
    if (bonusList != null) {
        for (let bonusStr of bonusList) {
            bonus += parseInt(bonusStr);
        }
    }

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

    output += userTag + ' rolls **' + (rollTally).toString() + '**' + (isDamage ? ' damage' : '');
    if (rollTally == 1 && !isDamage) {
        output += ' **GLITCH**'
    }

    if (bonus > 0) {
        output += ' (+' + bonus.toString() + ' bonus)';
    }

    if (bonus < 0) {
        output += ' (' + bonus.toString() + ' penalty)';
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
    let splitDice = diceStr.match(diceRegEx);
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

function getRerollButtons(userName, diceArg, modeArg, bonusArg) {
    if (modeArg == null) {
        modeArg = 'trait';
    }

    if (bonusArg == null) {
        bonusArg = 0;
    }
    
    let customId = encodeCustomId('reroll', userName, diceArg, modeArg, bonusArg.toString());
    
    return [new MessageActionRow().addComponents(
            [new MessageButton().setCustomId(customId)
                .setLabel('Reroll')
                .setStyle('SECONDARY')
        ])];
}

function respondToReroll(interaction) {
    let customId = interaction.component.customId;
    let splitId = parseCustomId(customId);
    // split format: reroll, userName text, userName numbers, diceArg, modeArg, bonusArg
    let userTag = splitId[1];
    let diceArg = splitId[2];
    let modeArg = splitId[3];
    let bonusArg = parseInt(splitId[4]);
    if (interaction.user.tag != userTag) {
        return {
            content: interaction.message.content + '\n Wrong user attempted reroll',
            components: interaction.message.components
        }
    }

    return {
        content: interaction.message.content + '\n' + handleRolls(userTag, diceArg, modeArg, bonusArg),
        components: interaction.components
    };
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
        let output = '**' + this.total.toString() + '** (';
        for (let result of this.results) {
            output = output + result.toString() + ', ';
        }
        output = output.substring(0, output.length-2) + ')';
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


module.exports.respondToReroll=respondToReroll;