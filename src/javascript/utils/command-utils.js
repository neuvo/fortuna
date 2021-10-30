const { MessageActionRow } = require("discord.js");

let delimiter=':';

module.exports.delimiter=delimiter;

module.exports.backupPath=__dirname + '/../../data/backup_deck.db';

/**
 * Creates a custom ID with delimited data, useful for responding to a command button
 * @param {array} idParts An array of data to be encoded into a button custom ID
 * @returns A string of encoded data suitable for a button custom ID
 */
function encodeCustomId() {
    let customId = '';
    for (let i = 0; i < arguments.length; ++i) {
        if (typeof arguments[i] != "string") {
            arguments[i] = arguments[i].toString();
        }

        // remove delimiter from argument
        let currArg = arguments[i].replaceAll(delimiter, '');

        if (currArg.length > 0) {
            customId += currArg;
        }

        if (i < arguments.length-1) {
            customId += delimiter;
        }
    }
    return customId;
}

/**
 * Splits the given custom ID into its component parts
 * @param {string} customId The custom ID of a button
 * @returns An array of the individual components of the custom ID
 */
function parseCustomId(customId) {
    return customId.split(delimiter);
}

function getSendableComponents(buttonList) {
    let output = [];
    let actionRow = new MessageActionRow();
    for (let i = 0; i < buttonList.length; ++i) {
        actionRow.addComponents(buttonList[i]);
        if (actionRow.components.length == 5) {
            output.push(actionRow);
            actionRow = new MessageActionRow();
        }
    }

    if (actionRow.components.length > 0) {
        output.push(actionRow);
    }

    return output;
}

function getNickname(interaction) {
    let cache = interaction.guild.members.cache;
    if (cache.has(interaction.user.id) && cache.get(interaction.user.id).nickname != null) {
        return cache.get(interaction.user.id).nickname;
    } else {
        return interaction.user.username;
    }
}

module.exports.encodeCustomId=encodeCustomId;
module.exports.parseCustomId=parseCustomId;
module.exports.getSendableComponents=getSendableComponents;
module.exports.getNickname=getNickname;