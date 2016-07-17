import EventEmitter from 'events'

export class DummyLobby extends EventEmitter{
}

class Peer extends EventEmitter{
}

export function ClientServerConnect(client, server){
    const client_peer = new Peer()
    const server_peer = new Peer()
    client_peer.send = (data) => {
        server_peer.emit('data', data)
    }
    server_peer.send = (data) => {
        client_peer.emit('data', data)
    }
    client.gamelobby.emit('peer', client_peer)
    server.gamelobby.emit('peer', server_peer)
}
