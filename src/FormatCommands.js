const COMMANDS = require('../commands.json');

const formatCommands = () => {
    return COMMANDS.map(command => (
        {
            title: `${command.text}${command.hasMore ? ' <more args>' : ''}`,
            content: `\`\`\`
Keywords: ${command.keywords.join(', ')}
Sensitivity: ${(command.sensitivity * 100).toFixed(2)}%\`\`\``
        }
    ))
}

module.exports = formatCommands;