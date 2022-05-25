const { SlashCommandBuilder } = require('@discordjs/builders')
const { SlashCommandManager } = require('./slashCommandManager')


exports.SlashCommandsInit = function(guildID, botID, token) {
    const slaComMan = new SlashCommandManager(guildID,botID,token)
    //Add commands
    slaComMan.addSlashCommand(
        new SlashCommandBuilder()
            .setName('tictactoe')
            .setDescription('TicTacToe game')
            .addSubcommand(subcommand => 
                subcommand.setName('help')
                .setDescription('Information about the game and commands')
            )
            .addSubcommand(subcommand => 
                subcommand.setName('invite')
                .setDescription('Start the game')
                .addUserOption(user =>
                    user.setName('target')
                    .setDescription('The player you want to play with')
                    .setRequired(true)
                )
            )
            .addSubcommand(subcommand =>
                subcommand.setName('join')
                .setDescription('[For owner]\nThe text channel on which the bot will function')
                .addStringOption(int => 
                    int.setName('id')
                    .setDescription('ID Channel')
                )
            )
            .addSubcommand(subcommand => 
                subcommand.setName('exit')
                .setDescription('Exit the game')
            )
            .addSubcommand(subcommand => 
                subcommand.setName('getid')
                .setDescription('Get ID user.')
                .addStringOption(username =>
                    username.setName('username')
                    .setDescription('User name')
                    .setRequired(true)
                )
            )
    )

    //put commands
    slaComMan.put()
    return slaComMan
}