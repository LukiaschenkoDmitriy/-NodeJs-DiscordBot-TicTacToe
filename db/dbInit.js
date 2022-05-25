const Sequelize = require('sequelize');

const Server = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: 'database.sqlite',
})

const DataBaseServers = Server.define('serversTable', {
    serverID: {
        type: Sequelize.STRING,
        unique: true,
    },
    gameID: {
        type: Sequelize.BIGINT,
        unique: true,
    },
    channelID: {
        type: Sequelize.STRING,
        unique: true
    }
}, {timestamps: false,})


const DataBaseWinsPlayers = Server.define('windsTable', {
    playerID: {
        type: Sequelize.STRING,
        unique: true,
    },
    wins: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
    }
}, {timestamps: false,})

exports.DataBaseServers = DataBaseServers
exports.DataBaseWinsPlayers = DataBaseWinsPlayers