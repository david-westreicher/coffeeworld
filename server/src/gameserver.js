'use strict'

const TICK_RATE = 1000.0/20

class GameServer{
    constructor(gameimpl){
        this.peerids = new Map()
        this.commandqueue = []
        this.gameimpl = gameimpl
        this.start()
    }

    newpeer(peer){
        console.log('newpeer')
        const id = this.newid()
        this.peerids.set(peer, id)

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
        let cmd = this.gameimpl.cmd_from_data(data)
        const oldid = this.peerids.get(peer)
        if(oldid != cmd.id){
            throw 'oldid!=cmd.id: ', oldid, cmd.id
        }
        this.peerids.set(peer, cmd.id)
        this.commandqueue.push(cmd)
    }

    deletepeer(peer){
        const id = this.peerids.get(peer)
        console.log('deletepeer', id)
        this.commandqueue.push({
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
        const queuesize = this.commandqueue.length
        for(let i=0; i<queuesize; i++){
            let cmd = this.commandqueue.shift()
            this.gameimpl.add_cmd(cmd)
        }
        this.gameimpl.tick()

        for(const [peer, id] of this.peerids){
            const buffer = this.gameimpl.buff_from_id(id)
            peer.send(buffer)
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
