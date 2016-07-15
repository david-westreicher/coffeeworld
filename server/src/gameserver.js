'use strict'
const StateManager = require('./shared/statemanager')
const NetworkLayer = require('./shared/networklayer')

class GameServer{
    constructor(config, gamelogic){
        this.peers_without_ids = new Set()
        this.statemanager = new StateManager(config.get_entities)
        this.peerids = new Map()
        this.tick_rate = 1000.0/config.server_tickrate
        this.start()
        this.network = NetworkLayer.createServer(config.get_command, config.get_entities)
        this.network.on_cmd = this.on_cmd.bind(this)
        this.gamelogic = gamelogic
        this.gamelogic.statemanager = this.statemanager
    }

    newpeer(peer){
        console.log('newpeer')
        const playerid = this.new_playerid()
        this.peerids.set(peer, playerid)
        this.gamelogic.new_player(playerid)
        this.peers_without_ids.add(peer)
        console.log('new player with id: ' + playerid)

        /*
        // send id to client
        const messagebuf = new Int16Array(1)
        messagebuf[0] = playerid
        peer.send(messagebuf)
        */
    }

    new_playerid(){
        let id = Math.floor(Math.random()*256)
        const used_ids = Array.from(this.peerids.values())
        while(used_ids.includes(id)){
            id = Math.floor(Math.random()*256)
        }
        return id
    }

    on_cmd(peer, cmd, id){
        this.peers_without_ids.delete(peer)

        const oldid = this.peerids.get(peer)
        const newid = cmd.playerid
        if(oldid != newid){
            console.log(oldid, newid)
            // TODO is this a hacking attempt?
            throw 'oldid!=evnt.id: ', oldid, newid
        }
    }

    newdata(data, peer){
        this.network.on_server_data(data, peer)
        /*
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
        */
    }

    deletepeer(peer){
        const playerid = this.peerids.get(peer)
        console.log('deletepeer', playerid)
        this.gamelogic.player_left(playerid)
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
        this.gamelogic.tick(this.statemanager.state, this.network.get_cmds())

        for(const [peer, playerid] of this.peerids){
            if(this.peers_without_ids.has(peer)){
                this.network.send_playerid(playerid, peer)
            }else{
                this.network.send_state(this.statemanager.state, peer)
            }
            //peer.send(this.statemanager.get_snapshot())
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
