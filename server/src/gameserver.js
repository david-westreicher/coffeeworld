'use strict'

const TICK_RATE = 1000.0/20

class GameServer{
    constructor(game){
        this.game = game
        this.peerids = new Map()
        this.eventqueue = []
        this.start()
    }

    newpeer(peer){
        console.log('newpeer')
        const id = this.newid()
        this.peerids.set(peer, id)
        this.game.new_player(id)

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
        const evnt = this.game.event_from_netcmd(data.slice(2))
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
                this.game.state.delete(evnt.id)
                deleted.push(evnt.id)
            }else{
                if(!deleted.includes(evnt.id))
                    evnt_queue.push(evnt)
            }
        }
        this.game.tick(evnt_queue)

        for(const [peer, id] of this.peerids){
            const netstate = []
            for(const [id, entity_state] of this.game.state){
                netstate.push(id)
                this.game.data_from_entity_state(netstate, entity_state)
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
