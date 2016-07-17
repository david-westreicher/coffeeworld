'use strict'
const Config = require('../game/config')
const GameLogic = require('../game/gamelogic')
const GameLobby = require('./gamelobby')
const StateManager = require('./statemanager')
const NetworkLayer = require('./networklayer')
const AccurateTimer = require('./util')
const DummyLobby = require('./dummy').DummyLobby
const EventEmitter = require('events')

class Server extends EventEmitter{
    constructor(){
        super()
        this.peerids = new Map()
        this.peers_without_ids = new Set()
        this.peers = new Set()
        this.commands = []

        this.statemanager = new StateManager(Config.get_entities)
        this.network = NetworkLayer.createServer(Config)
        this.network.on('command', (cmd)=>{
            this.commands.push(cmd)
            this.peers_without_ids.delete(cmd.playerid)
            /*
            // TODO is this a hacking attempt?
            const oldid = this.peerids.get(peer)
            const newid = cmd.playerid
            if(oldid != newid){
                console.log(oldid, newid)
                throw 'oldid!=evnt.id: ', oldid, newid
            }*/
        })

        this.gamelobby = Config.local_play ? new DummyLobby() : new GameLobby(false, Config.lobby_ip)
        this.gamelobby.on('peer', (peer) => {
            console.log('new peer',peer)
            this.network.connect(false, peer)
            const playerid = this.new_playerid()
            this.peerids.set(peer, playerid)
            this.gamelogic.new_player(this.statemanager, playerid)
            this.peers_without_ids.add(playerid)
            console.log('new player with id: ' + playerid)
            this.emit('log', 'info', 'new player with id: ' + playerid)
        })
        this.gamelobby.on('peer_left', (peer) => {
            const playerid = this.peerids.get(peer)
            console.log('deletepeer', playerid)
            this.gamelogic.player_left(this.statemanager, playerid)
            this.peerids.delete(peer)
            this.emit('log', 'info', 'player left with id: ' + playerid)
        })

        this.gamelobby.on('log', (type, text)=>{
            this.emit('log', type, text)
        })
        this.network.on('log', (type, text)=>{
            this.emit('log', type, text)
        })

        this.gamelogic = new GameLogic()
        this.start()
    }

    new_playerid(){
        //TODO optimize
        let id = Math.floor(Math.random()*256)
        const used_ids = Array.from(this.peerids.values())
        while(used_ids.includes(id)){
            id = Math.floor(Math.random()*256)
        }
        return id
    }

    start(){
        const tick_rate = 1000.0/Config.server_tickrate
        console.log('Starting GameServer with TICKRATE: '+ tick_rate)

        this.tickinterval = new AccurateTimer(this._tick.bind(this), tick_rate)
        this.tickinterval.start()
        this.emit('log', 'success', 'starting gameloop with rate: ' + tick_rate)
    }

    _tick(){
        this.gamelogic.tick(this.statemanager, this.commands)
        this.commands = []

        for(const [peer, playerid] of this.peerids){
            if(this.peers_without_ids.has(playerid)){
                this.network.send_playerid(playerid, peer)
            }else{
                this.network.send_state(this.statemanager.state, peer)
            }
            //peer.send(this.statemanager.get_snapshot())
        }
    }
}

module.exports = Server
