const { REST } = require('@discordjs/rest')
const { Routes } = require('discord-api-types/v9')

exports.SlashCommandManager = class {
    constructor(guildID, botID, token) {
        this.guildID = guildID
        this.botID = botID
        this.commands = []

        this.rest = new REST({ version: '9' }).setToken(token)
    }

    addSlashCommand(SlashCommandBuilderObject) {
        this.commands.push(SlashCommandBuilderObject)
    }

    removeSplashCommand(index) {
        this.commands.filter(command => this.commands.indexOf(command) != index)
    }

    getCommands() {
        return this.commands
    }

    put() {
        if (!this.commands) return false

        this.rest.put(Routes.applicationGuildCommands(this.botID,this.guildID), {body: this.commands.map(command => command.toJSON())})
            .then(() => console.log('Command registered!'))
            .catch((err) => console.log(err))
        return true
    }

}