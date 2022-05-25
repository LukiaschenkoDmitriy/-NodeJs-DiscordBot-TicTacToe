const { Client, Intents } = require('discord.js')
const { token, botID, helpContent } = require('./config.json')
const { SlashCommandsInit } = require('./src/allSlashCommands')
const { Game } = require('./src/game');
const { DataBaseServers } = require('./db/dbInit')

const client = new Client({intents : [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS]})

if (process.argv[2] == 'init') {require('./src/allSlashCommands').SlashCommandsInit('950106101834203208', botID, token)}

//Variables
let gamesRoom = [];
filterRooms = (server) => gamesRoom.filter(game => game.gameID == server.gameID)[0]

//first start
DataBaseServers.sync().then(() => {
    DataBaseServers.findAll().then(servers => {
        for (server of servers) {
            gamesRoom.push(new Game(server.gameID))
        }
    })
})


// Started bot
client.on('ready', () => console.log('Bot ready!'))

// join in guild
client.on('guildCreate', async (guild) => {
    SlashCommandsInit(guild.id,botID,token);

    //Check has server in Database
    DataBaseServers.findOne({where: {serverID: String(guild.id)}}).then(data => {
        if (!data) {
            let mathGameID =  Math.round(Math.random()*1000000000000)
            DataBaseServers.create({
                serverID: String(guild.id),
                gameID: mathGameID
            })
            gamesRoom.push(new Game(mathGameID))
            delete mathGameID
        }
    })
    DataBaseServers.sync()
})

//left the guild
client.on('guildDelete', guild => {
    DataBaseServers.findOne({where: {serverID: guild.id}}).then(server => {
        gameRoom = gamesRoom.filter(game => game.gameID != server.gameID)
        DataBaseServers.destroy({where: {serverID: guild.id}})
    })
})

//interactions
client.on('interactionCreate', async (inter) => {
    if (inter.isCommand()) {
        if (inter.commandName == 'tictactoe') {
            if (inter.options.getSubcommand() == 'help') {
                //output help
                inter.reply({content:helpContent, ephemeral:true})
            }
            else if (inter.options.getSubcommand() == 'invite') {
                let skip = true;

                //check 'The bot on channel'?
                await DataBaseServers.findOne({where: {serverID: String(inter.guild.id)}}).then(server => {
                    if (!server.channelID) {
                        inter.reply({content:  `You have not joined the bot to the channel, use the command /tictactoe join 'channeID'`, ephemeral:true})
                        skip = false;
                        
                    }
                    else if (server.channelID != inter.channel.id) {
                        inter.guild.channels.fetch(server.channelID).then(channel => {
                            inter.reply({content: `Go to '${channel.name}' channel to interact with the bot.`, ephemeral:true})
                            skip = false;
                        })
                    }
                })

                //If bot != on channel = exit
                if (!skip) return
 
                //check user && connection the game
                const user = inter.options.getUser('target')

                if (!user || user.bot) {
                    inter.reply({content: `The player ID is incorrect or you want to play with a bot.`, ephemeral:true})
                    return
                }

                DataBaseServers.findOne({where: {serverID: String(inter.guild.id)}}).then(server => {
                    const game = filterRooms(server)
                    if (!game.player1) {
                        game.invitePlayer(inter,user)
                        return
                    }
                    inter.reply({content: 'Game unavailable', ephemeral:true})
                })  
            }

            else if (inter.options.getSubcommand() == 'join') {
                //You onwer? No? No permission!
                if (inter.guild.ownerId != inter.user.id) {inter.reply({content: `You don't have persmissions`, ephemeral:true}); return}

                //Get current or specified channel
                const new_channel_id = (inter.options.getString('id'))? inter.options.getString('id'): inter.channelId

                //install bot channel
                if (inter.guild.channels.cache.has(new_channel_id)) {
                    //output a success message
                    inter.guild.channels.fetch(new_channel_id).then(channel => {
                        inter.reply(`Bot has joined '${channel.name}' channel`)
                    })

                    DataBaseServers.update({channelID: new_channel_id}, {where: {serverID: String(inter.guild.id)}})
                    DataBaseServers.sync()
                    return
                }

                //output a reject message
                inter.reply({content: 'Channel does not exist', ephemeral:true})
            }

            else if (inter.options.getSubcommand() == 'getid') {
                //get user name
                const username = inter.options.getString('username');

                //check if user name in members
                inter.guild.members.fetch().then(members_prom => {
                    for (member of members_prom) {
                        const user = member[1].user;
                        if (username == user.username) {
                            //result
                            inter.reply({content: `${user} id: ${user.id}`, ephemeral:true})
                            return
                        }
                    }
                    //error
                    inter.reply({content: `User name ${username} invalid`, ephemeral:true})
                })
            }

            else if (inter.options.getSubcommand() == 'exit') {
                //exit the game
                DataBaseServers.findOne({where: {serverID: String(inter.guild.id)}}).then(server => {
                    const game = filterRooms(server)
                    if (game.player2) {
                        if (inter.user.id == game.player1.id) {
                            game.winner = 'red';
                            game.winnerFunct()
                        }
                        else if (inter.user.id == game.player2.id) {
                            game.winner = 'blue';
                            game.winnerFunct()
                        }
                        inter.reply(`Player ${inter.user} exit the game`)
                        return
                    }
                    inter.reply({content: 'You are not in the game now', ephemeral:true})
                })
            }
        }
    }
})

client.login(token)