require('dotenv-defaults').config()

const { Client, Intents } = require("discord.js")
const { joinVoiceChannel } = require('@discordjs/voice')
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES] })
const Player = require('./player.js')
const Listener = require('./listener.js')
const CommandManager = require('./CommandManager.js')
const { resolve } = require('path')
const COMMANDS = require('../commands.json');
const messageBuilder = require('./MessageBuilder.js')
const formatCommands = require('./FormatCommands.js')

const BEEP = resolve('./res/beep.wav')
const VERBOSE = JSON.parse(process.env.VERBOSE);

let player = null
let listener = null
let voiceConnection = null
let currentChannel = null
let currentTextChannel = null
let commandManager = new CommandManager(VERBOSE)

// Add command handlers for command words
function registerCommands() {
    COMMANDS.forEach(command => (
        command.keywords.forEach(keyword => {
            commandManager.addPluginHandle(keyword, command);
        })
    ));
}

// Connect to a voice channel
function connectToChannel(channel, id, textChannel) {
    if (channel.id == currentChannel?.id) {
        return
    }

    // Leave current channel if in one
    if (voiceConnection != null) {
        leaveChannel()
    }

    voiceConnection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: false
    });

    player = new Player({ voiceConnection: voiceConnection })
    listener = new Listener({ voiceConnection: voiceConnection })
    currentChannel = channel
    currentTextChannel = textChannel

    listener.on('wakeWord', (userId) => {
        listener.listenForCommand(userId)
        player.playFile(BEEP);
        console.log(`Wake word for: ${userId}`);
        if (VERBOSE) {
            currentTextChannel.send(`Kekeres? <@${userId}>`);
        }
    })

    listener.on('command', (userId, command) => {
        processCommand({
            command,
            userId,
            commandType: 'voice',
            currentTextChannel,
            player,
        })
    })

    refreshUsers()
}

// Leave the voice channel
// Close the resources
async function leaveChannel() {
    console.log('Leaving channel')

    currentChannel = null

    if (listener != null) {
        listener.close()
        listener = null
    }

    if (voiceConnection != null) {
        voiceConnection.destroy()
        voiceConnection = null
    }

    if (commandManager != null) {
        commandManager.close()
    }
}

// Refresh the users that are being listened to
function refreshUsers() {
    if (currentChannel == null) {
        return
    }

    console.log('Refreshing users')

    listener.close()
    currentChannel.members.forEach(member => {
        if (member.user.bot) {
            // Ignore bots
            return
        }
        listener.subscribeToUser(member.id)
    });
}

// Process a command from a user
function processCommand(options) {
    console.log(`Processing command: ${options.command}`)

    if (VERBOSE) {
        currentTextChannel.send(`Processing command: ${options.command}`)
    }

    commandManager.processCommand(options)
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// Interactions with chat messages
client.on('messageCreate', async (message) => {
    if (message.member.user.bot) {
        // Ignore bots
        return
    }

    switch (message.content.toLowerCase()) {
        case '-join':
        case '-summon':
            if (message.member.voice.channel != null) {
                if (this.voiceConnection == null) {
                    connectToChannel(message.member.voice.channel, message.author.id, message.channel)
                }
            }
            break;
        case '-exit':
        case '-leave':
            leaveChannel()
            break;
        case '-voice':
        case '-commands':
        case '-voicecommands':
            message.channel.send({ embeds: [messageBuilder('Current Wake Word: **Kekeres**', formatCommands())] });
            break;
        default:
            break;
    }
});

client.on('voiceStateUpdate', (oldState, newState) => {
    if (currentChannel === null) {
        // No connected channel
        return
    }

    refreshUsers()

    // Leave if everyone leaves
    // == 1 to account for the bot itself
    if (currentChannel.members.size === 1) {
        leaveChannel()
    }
})

registerCommands()

client.login(process.env.BOT_TOKEN);
//client.login(process.env.BOT_TOKEN_DEV);