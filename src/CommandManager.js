const ss = require("string-similarity");
const { resolve } = require('path')
const RIGHT = resolve('./res/right.wav')
const WRONG = resolve('./res/wrong.mp3')

const VERBOSE = JSON.parse(process.env.VERBOSE);

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
        const { currentTextChannel, player } = options;
        const command = options.command.toLowerCase();
        const commandArray = command.split(' ');
        const commandWord = commandArray.splice(0, 1)[0];
        const commandText = commandArray.join(' ');
        let closestCommand = this.getClosestCommand(command, commandWord);

        if (VERBOSE) {
            currentTextChannel.send(`Best match: ${closestCommand.key} (${closestCommand.isWord ? 'word' : 'sentence'} ${(closestCommand.accuracy * 100).toFixed(2)}%)`)
        }

        if (closestCommand.accuracy < closestCommand.command.sensitivity) {
            console.log(command.length)
            if(command.length <= 2 && this.pluginMap.has('kekeres')) {
                closestCommand = {
                    key: 'kekeres',
                    command: this.pluginMap.get('kekeres'),
                    accuracy: 1,
                    isWord: true,
                }
            } else {
                player.playFile(WRONG);
                if (VERBOSE) {
                    currentTextChannel.send('Voice command does not resemble any of the defined commands.');
                }
                return;
            }
        }

        // Execute the command
        player.playFile(RIGHT);
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
