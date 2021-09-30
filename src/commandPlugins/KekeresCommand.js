const ICommand = require('./ICommand')

class PlayCommand extends ICommand {
    constructor() {
        super()
    }

    wakeWordDetected(options) {
        return true
    }

    command(options) {
        options.messageChannel.send('-kekeres')
    }

    close() {
    }
}

module.exports = PlayCommand