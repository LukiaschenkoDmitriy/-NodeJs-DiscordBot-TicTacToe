const {DataBaseServers, DataBaseWinsPlayers} = require('./dbInit')

DataBaseServers.sync()
DataBaseWinsPlayers.sync()
DataBaseServers.findAll().then(servers => {
    for (server of servers) {
        console.log(server)
    }
})

DataBaseWinsPlayers.findAll().then(players => {
    for (player of players) {
        console.log(player)
    }
})