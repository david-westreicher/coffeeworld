import EventEmitter from 'events'
import AccurateTimer from './util'

const DELAY = 0
const PACKET_DROP = 0.0

export class DummyLobby extends EventEmitter{
}

class Peer extends EventEmitter{
}

class UnreliableNetwork{
    // TODO could also simulate UDP out of order jitter
    constructor(game, peer_in, peer_out){
        this.buffer = []
        peer_in.send = (data) => {
            const now = window.performance.now()
            this.buffer.push({
                time: now,
                data: new Buffer(data),
            })
        }
        this.peer_out = peer_out
        game.gamelobby.emit('peer', peer_in)
    }
    tick(){
        const now = window.performance.now()
        while(this.buffer.length>0){
            const packet = this.buffer[0]
            if(now > (packet.time + DELAY)){
                if(Math.random()>PACKET_DROP)
                    this.peer_out.emit('data', packet.data)
                this.buffer.shift()
            }else{
                break
            }
        }
    }
}

export function ClientServerConnect(client, server){
    const client_peer = new Peer()
    const server_peer = new Peer()
    const client_network = new UnreliableNetwork(client, client_peer, server_peer)
    const server_network = new UnreliableNetwork(server, server_peer, client_peer)
    const timer = new AccurateTimer(()=>{
        client_network.tick()
        server_network.tick()
    }, 5)
    timer.start()
}
