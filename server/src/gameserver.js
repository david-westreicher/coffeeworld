'use strict'
const Config = require('./shared/config')
const ByteEncoder = require('./shared/lib/byteencoder')
const StateManager = require('./shared/lib/statemanager')
const TICK_RATE = 1000.0/Config.server_tickrate

class GameServer{
    constructor(network){
        this.peerids = new Map()
        this.eventqueue = []
        this.network = network
        this.statemanager = new StateManager(network)
        this.cmds = []
        this.cmdspointer = 0
        this.start()

        const command = network.get_command()
        command.playerid = 0
        this.command_encoder = new ByteEncoder(command)
    }

    newpeer(peer){
        console.log('newpeer')
        const playerid = this.new_playerid()
        this.peerids.set(peer, playerid)
        this.new_player(playerid)
        console.log('new player with id: ' + playerid)

        // send id to client
        const messagebuf = new Int16Array(1)
        messagebuf[0] = playerid
        peer.send(messagebuf)
    }

    new_playerid(){
        let id = Math.floor(Math.random()*1000)
        while(Array.from(this.peerids.values()).includes(id)){
            id = Math.floor(Math.random()*1000)
        }
        return id
    }

    newdata(data, peer){
        // TODO this is not thread safe => problem?
        if(this.newdataenter)
            throw 'THREAD EXCEPTION'
        this.newdataenter = true


        while(this.cmds.length <= this.cmdspointer){
            this.cmds.push(this.network.get_command())
        }
        const cmd = this.cmds[this.cmdspointer++]
        this.command_encoder.set_data(data.buffer)
        this.command_encoder.update_object_from_data(cmd)
        //console.log('got cmd', cmd)

        const oldid = this.peerids.get(peer)
        const newid = cmd.playerid
        if(oldid != newid){
            console.log(oldid, newid)
            // TODO is this a hacking attempt?
            throw 'oldid!=evnt.id: ', oldid, newid
        }

        this.newdataenter = false
    }

    deletepeer(peer){
        const playerid = this.peerids.get(peer)
        console.log('deletepeer', playerid)
        this.player_left(playerid)
        this.peerids.delete(peer)
    }

    start(){
        if(this.tickinterval){
            // TODO could restart server
            console.log('server already started')
            return
        }
        console.log('Starting GameServer with TICKRATE: '+TICK_RATE)
        this.tickinterval = setInterval(this.tick.bind(this), TICK_RATE)
    }

    tick(){
        this.real_tick(this.statemanager.state, this.cmds.slice(0,this.cmdspointer))
        this.cmdspointer = 0

        for(const [peer, playerid] of this.peerids){
            peer.send(this.statemanager.get_snapshot())
        }
    }

    stop(){
        if(!this.tickinterval){
            console.log('server already stopped')
            return
        }
        clearInterval(this.tickinterval)
        this.tickinterval = null
    }

}

module.exports = GameServer
