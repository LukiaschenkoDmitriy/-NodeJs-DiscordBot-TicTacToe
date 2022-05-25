const {  MessageActionRow, MessageButton, MessageEmbed } = require('discord.js')
const { DataBaseWinsPlayers } = require('../db/dbInit')

exports.Game = class {
    constructor(gameID) {
        this.gameID = gameID;

        this.player1 = undefined;
        this.player2 = undefined;

        this.game_field = [[0,0,0],
                           [0,0,0],
                           [0,0,0]]

        this.firstGamer = true

        this.mess_infoPlayer1 = undefined;
        this.mess_infoPlayer2 = undefined;
        this.mess_button_field = undefined;

        this.buttonEmbeds
        
        this.winner = undefined;

        this.winsFirstPlayer = 0;
        this.winsSecondPlayer = 0;

        this.mainCollector = undefined;

        DataBaseWinsPlayers.sync()

        this.message = new MessageActionRow()
            .addComponents(
                [new MessageButton()
                    .setCustomId('in_accept')
                    .setLabel('Accept')
                    .setStyle('SUCCESS'),
                new MessageButton()
                    .setCustomId('in_reject')
                    .setLabel('Reject')
                    .setStyle('DANGER')
                ])

    }

    async init() {
        this.player1 = undefined;
        this.player2 = undefined;

        this.game_field = [[0,0,0],
                           [0,0,0],
                           [0,0,0]]

        this.firstGamer = true

        this.mess_infoPlayer1 = undefined;
        this.mess_infoPlayer2 = undefined;
        this.mess_button_field = undefined;

        this.buttonEmbeds
        
        this.winner = undefined;

        this.winsFirstPlayer = 0;
        this.winsSecondPlayer = 0;

        this.mainCollector = undefined;

        DataBaseWinsPlayers.sync()
    }

    invitePlayer(inter,player2) {
        this.player1 = inter.user

        let btnmes = inter.reply({content: `The ${inter.user} is willing to play with the user ${player2}`, components: [this.message]})

        const collector = inter.channel.createMessageComponentCollector({time: 30000})
        collector.on('collect', async btn => {
            if (btn.user.username == player2.username) {
                if (btn.customId == 'in_accept') {
                    this.player2 = player2
                    this.startgame(btn)
                }
                else {
                    btn.reply({content: `${player2} does not want to play with you :(`, ephemeral:true})
                    this.init()   
                }
                inter.deleteReply(btnmes);
                btnmes = undefined
                collector.stop()
            }
            else {
                if (btn.user.username == this.player1.username && btn.customId == 'in_reject') {
                    btn.reply({content: 'You canceled the game.', ephemeral:true})
                    inter.deleteReply(btnmes)

                    btnmes = undefined

                    this.init()
                    collector.stop()
                    return
                }
                btn.reply({content: `You don't have to accept/reject fate in the game`, ephemeral:true})
            }
        })

        collector.on('end', btn => {
            if (btnmes) {
                this.init()
                inter.deleteReply(btnmes)
            }
        })
    }

    _createDBPlayer(player) {
        DataBaseWinsPlayers.create({
            playerID: String(player.id),
            wins: 0
        })
    }

    async databaseCheck() {
        // db check
        //first player
        await DataBaseWinsPlayers.findOne({where: {playerID: String(this.player1.id)}}).then(data => {
            if (data) {this.winsFirstPlayer = data.wins; return}
            this._createDBPlayer(this.player1)
        })

        //second player
        await DataBaseWinsPlayers.findOne({where: {playerID: String(this.player2.id)}}).then(data => {
            if (data) {this.winsSecondPlayer = data.wins; return}
            this._createDBPlayer(this.player2)
        })
    }

    startgame(btn) {
        this.databaseCheck().then(() => {
            this.mainCollector = btn.channel.createMessageComponentCollector({time: 120000})

            this.mess_infoPlayer1 = btn.channel.send({embeds: [this.embedFirstPlayer()]})
            this.mess_button_field = btn.channel.send({components: this.createFieldButton()})
            this.mess_infoPlayer2 = btn.channel.send({embeds: [this.embedSecondPlayer()]})
    
            this.mainCollector.on('collect', async event => {
                if (event.user.id == this.player1.id || event.user.id == this.player2.id) {
                    this.update(event)
                }
            })

            this.mainCollector.on('end', packEvents => {
                if (!this.winner) {
                    const player = (this.firstGamer)?this.player1:this.player2
                    btn.channel.send(`Player ${player} fell a sleep`)
                    if (this.firstGamer) {
                        this.winner = 'red'
                    }
                    else {
                        this.winner = 'blue'
                    }
                    this.winnerFunct()
                }
            })
        })
    }

    rules() { 
        if (this.game_field.every(array => {
            if (array.every(item => item != 0)) return true
            return false
        })) {
            this.winner = 'all'
        }

        // check col
        this.game_field.some(array => {
            if (array.every(n => n == 1)) this.winner = 'blue'
            else if (array.every(n => n == 2)) this.winner = 'red'
        })

        // check row
        for (let num=0;num<3;num++) {
            let row_arr = []
            for (let array of this.game_field) {
                row_arr.push(array[num])
            }
            if (row_arr.every(item => item == 1)) {this.winner = 'blue';}
            else if (row_arr.every(item => item == 2)) {this.winner = 'red';}
        }

        //check X pos
        if ([this.game_field[0][0],this.game_field[1][1],this.game_field[2][2]].every(item => item == 1)) {this.winner = 'blue';}
        else if ([this.game_field[0][0],this.game_field[1][1],this.game_field[2][2]].every(item => item == 2)) {this.winner = 'red';}

        if ([this.game_field[0][2],this.game_field[1][1],this.game_field[2][0]].every(item => item == 1)) {this.winner = 'blue';}
        else if ([this.game_field[0][2],this.game_field[1][1],this.game_field[2][0]].every(item => item == 2)) {this.winner = 'red';}

        if (this.winner) {this.winnerFunct()}

    }

    async winnerFunct() {
        if (this.winner == 'blue') {
            this.mess_infoPlayer1.then(embed => {
                const new_embed = embed.embeds[0].setTitle('Winner!').setColor('#1ddb1d')
                embed.edit({embeds: [new_embed]})
            })
    
            this.mess_infoPlayer2.then(embed => {
                const new_embed = embed.embeds[0].setColor('#949494')
                embed.edit({embeds: [new_embed]})
            })

            DataBaseWinsPlayers.findOne({where: {playerID: String(this.player1.id)}}).then(data => {
                data.increment('wins')
            })
        }

        else if (this.winner == 'all') {
            this.mess_infoPlayer1.then(embed => {
                const new_embed = embed.embeds[0].setColor('#949494')
                embed.edit({embeds: [new_embed]})
            })
    
            this.mess_infoPlayer2.then(embed => {
                const new_embed = embed.embeds[0].setColor('#949494')
                embed.edit({embeds: [new_embed]})
            })
        }
        
        else if (this.winner == 'red') {
            this.mess_infoPlayer2.then(embed => {
                const new_embed = embed.embeds[0].setTitle('Winner!').setColor('#1ddb1d')
                embed.edit({embeds: [new_embed]})
            })
    
            this.mess_infoPlayer1.then(embed => {
                const new_embed = embed.embeds[0].setColor('#949494')
                embed.edit({embeds: [new_embed]})
            })

            DataBaseWinsPlayers.findOne({where: {playerID: String(this.player2.id)}}).then(data => {
                data.increment('wins')
            })
        }

        this.mess_button_field.then(message => {
            const new_components = message.components
            for (let buttonrow of new_components) {
                for (let button of buttonrow.components) {
                    button.setDisabled(true)
                }
            }

            message.edit({components: message.components})
        })

        this.mainCollector.stop()
        this.init()
    }

    async update(event) {
        if (!event.isButton()) return
        this.mess_button_field.then(message => {
            const new_components = message.components
            for (let buttonrow of new_components) {
                for (let button of buttonrow.components) {
                    if (button.customId == event.customId) {
                        const btn_id = button.customId.split('_')

                        if (this.firstGamer && event.user.id == this.player1.id) {
                            button.setStyle('PRIMARY').setDisabled(true).setLabel('O')

                            this.game_field[btn_id[0]][btn_id[1]] = 1
                            this.firstGamer = false
                        }
                        else if (!this.firstGamer && event.user.id == this.player2.id){
                            button.setStyle('DANGER').setDisabled(true).setLabel('X')

                            this.game_field[btn_id[0]][btn_id[1]] = 2
                            this.firstGamer = true
                        }
                        message.edit({components: message.components})
                        this.rules()
                    }
                }
            }
        })

        event.reply({content: '\u200b', ephemeral:true})
    }

    embedFirstPlayer() {
        return new MessageEmbed()
        .setColor('#2137b5')
        .setAuthor({name: this.player1.username, iconURL: this.player1.displayAvatarURL()})
        .addFields({name:'Wins:', value: String(this.winsFirstPlayer), inline:true})

        .setDescription(`\nID: ${this.player1.id}`)
    }

    embedSecondPlayer() {
        return new MessageEmbed()
        .setColor('#d42222')
        .setAuthor({name: this.player2.username, iconURL: this.player2.displayAvatarURL()})
        .addFields({name:'Wins:', value: String(this.winsSecondPlayer), inline:true})
        .setDescription(`\nID: ${this.player2.id}`)
    }

    createFieldButton() {
        let buttonsField = []
        for (let i=0; i<3;i++) {
            let localbuttons = []
            for(let n=0;n<3;n++) {
                localbuttons.push(
                    new MessageButton()
                    .setCustomId(String(i)+'_'+String(n))
                    .setLabel('\n\n')
                    .setStyle('SECONDARY')
                )
            }
            buttonsField.push(new MessageActionRow().addComponents(localbuttons))
        }
        return buttonsField
    }

}