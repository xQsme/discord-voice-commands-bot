const ss = require("string-similarity");

class CommandManager {
    pluginMap = new Map()

    constructor() {

    }

    getClosestCommand(command, word) {
        const keys = Array.from(this.pluginMap.keys());
        const commandMatch = ss.findBestMatch(command, keys);
        const wordMatch = ss.findBestMatch(word, keys);
        const isWord = wordMatch.bestMatch.rating > commandMatch.bestMatch.rating;
        const { bestMatch } = isWord ? wordMatch : commandMatch;
        return {
            key: bestMatch.target,
            command: this.pluginMap.get(bestMatch.target),
            accuracy: bestMatch.rating,
            isWord,
        }
    }

    addPluginHandle(commandWord, commandObj) {
        if (this.pluginMap.has(commandWord)) {
            throw new Error(`Command ${commandWord} is already registered`)
        }
        this.pluginMap.set(commandWord, commandObj)
    }

    processCommand(options) {
        const { currentTextChannel } = options;
        const command = options.command.toLowerCase();
        const commandArray = command.split(' ');
        const commandWord = commandArray.splice(0, 1)[0];
        const commandText = commandArray.join(' ');
        const closestCommand = this.getClosestCommand(command, commandWord);

        if (process.env.DEV) {
            currentTextChannel.send(`Best match: ${closestCommand.key} (${closestCommand.isWord ? 'word' : 'sentence'} ${(closestCommand.accuracy * 100).toFixed(2)}%)`)
        }

        if (closestCommand.accuracy < parseFloat(process.env.COMMAND_MATCH_SENSITIVITY)) {
            currentTextChannel.send('Voice command does not resemble any of the defined commands.')
            return;
        }

        // Execute the command
        if (closestCommand.isWord && closestCommand.command.hasMore && commandText) {
            currentTextChannel.send(`-${closestCommand.command.text} ${commandText}`)
        } else {
            currentTextChannel.send(`-${closestCommand.command.text}`)
        }
    }

    close(options) {
        for (let [key, value] of this.pluginMap) {
            value.close(options)
        }
    }
}

module.exports = CommandManager