'use strict'
const Config = require('./shared/config')
const TICK_RATE = 1000.0/Config.server_tickrate

class GameServer{
    constructor(){
        this.peerids = new Map()
        this.eventqueue = []
        this.state = new Map()
        this.start()
    }

    newpeer(peer){
        console.log('newpeer')
        const id = this.newid()
        this.peerids.set(peer, id)
        this.new_player(id)

        // send id to client
        const messagebuf = new Int32Array(1)
        messagebuf[0] = id
        peer.send(messagebuf)
    }

    newid(){
        let id = Math.floor(Math.random()*1000)
        while(Array.from(this.peerids.values()).includes(id)){
            id = Math.floor(Math.random()*1000)
        }
        return id
    }

    newdata(data, peer){
        const newid = data.readInt16LE(0)
        const evnt = this.event_from_netcmd(data.slice(2))
        evnt.id = newid
        const oldid = this.peerids.get(peer)
        if(oldid != evnt.id){
            throw 'oldid!=evnt.id: ', oldid, evnt.id
        }
        this.peerids.set(peer, evnt.id)
        this.eventqueue.push(evnt)
    }

    deletepeer(peer){
        const id = this.peerids.get(peer)
        console.log('deletepeer', id)
        this.eventqueue.push({
            type: 'delete',
            id: id
        })
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
        // simulate received commands
        const queuesize = this.eventqueue.length
        const deleted = []
        const evnt_queue = []
        for(let i=0; i<queuesize; i++){
            let evnt = this.eventqueue.shift()
            if(evnt.type == 'delete'){
                this.state.delete(evnt.id)
                deleted.push(evnt.id)
            }else{
                if(!deleted.includes(evnt.id))
                    evnt_queue.push(evnt)
            }
        }
        this.real_tick(evnt_queue)

        for(const [peer, id] of this.peerids){
            const netstate = []
            for(const [id, entity_state] of this.state){
                netstate.push(id)
                this.data_from_entity_state(netstate, entity_state)
            }
            const messagebuf = new Int16Array(netstate)
            peer.send(messagebuf)
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
