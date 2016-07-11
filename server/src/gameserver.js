'use strict'
const ByteEncoder = require('./shared/byteencoder')
const StateManager = require('./shared/statemanager')

class GameServer{
    constructor(config){
        this.cmds = []
        this.cmdspointer = 0

        this.new_cmd = config.get_command
        const command = this.new_cmd()
        command.playerid = 0
        this.command_encoder = new ByteEncoder(command)

        this.statemanager = new StateManager(config.get_entities)
        this.peerids = new Map()
        this.tick_rate = 1000.0/config.server_tickrate
        this.start()
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
            this.cmds.push(this.new_cmd())
        }
        const cmd = this.cmds[this.cmdspointer++]
        this.command_encoder.set_data(data.buffer)
        this.command_encoder.update_object_from_data(cmd)

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
        console.log('Starting GameServer with TICKRATE: '+ this.tick_rate)
        this.tickinterval = setInterval(this._tick.bind(this), this.tick_rate)
    }

    _tick(){
        this.tick(this.statemanager.state, this.cmds.slice(0,this.cmdspointer))
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
