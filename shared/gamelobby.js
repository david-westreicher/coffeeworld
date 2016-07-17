const Peer = require('simple-peer')
const EventEmitter = require('events')
// emits, 'peer', 'servers'

class GameLobby extends EventEmitter{
    constructor(isclient, lobby_ip){
        super()
        this.isclient = isclient
        this.id = -1
        this.peer_from_id = new Map()
        this.create_websocket(lobby_ip)
    }

    connect_to(to_id){
        this.emit('log', 'info', 'connecting to ' + to_id)
        if(this.isclient && this.peer_from_id.size > 0){
            return
        }
        const peer = new Peer({
            initiator: this.isclient,
            config: {
                'iceServers': [{
                    url: 'stun:stun4.l.google.com:19302',
                    urls: 'stun:stun4.l.google.com:19302'
                }]
            },
            channelConfig: {
                ordered: false,
                maxRetransmits: 0
            },
            trickle: false,
            offerConstraints:{},
        })
        peer.on('signal', (data) => {
            console.log('[PEER] onsignal')
            console.log(data)
            this.emit('log', 'success', 'generated peer signal: ' + JSON.stringify(data) + ' for ' + to_id)
            const reply = {
                type: 'signal',
                from_id: this.id,
                to_id: to_id,
                data: data,
            }
            console.log('[PEER] sending reply')
            console.log(reply)
            const json = JSON.stringify(reply)
            this.emit('log', 'info', 'sending peer signal: ' + json + ' to ' + to_id)
            this.ws_connection.send(json)
        })
        peer.on('connect', () => {
            this.emit('log', 'success', 'connected to ' + to_id)
            this.emit('peer', peer)
            if(this.isclient){
                this.emit('log', 'info', 'closing websocket connection')
                this.ws_connection.close()
                this.ws_connection = null
            }
        })
        peer.on('error', (error) => {
            console.log('[PEER] onerror', error)
            this.emit('log', 'fail', 'error connecting to ' + to_id + ', error: ' + error)
            this.emit('peer_left', peer)
            this.peer_from_id.delete(to_id)
        })
        peer.on('close', () => {
            console.log('[PEER] onclose')
            this.emit('log', 'info', 'peer ' + to_id + ' closed connection')
            this.emit('peer_left', peer)
            this.peer_from_id.delete(to_id)
        })
        this.peer_from_id.set(to_id, peer)
    }

    create_websocket(lobby_ip){
        const ws_connection = new WebSocket(lobby_ip)
        ws_connection.onopen = () => {
            console.log('[GAMELOBBY] websocket onopen')
            console.log(this)
            this.emit('log', 'success', 'connected to lobby websocket: ' + lobby_ip)
            if(!this.isclient){
                const server_info = {
                    type: 'server',
                    name: 'test',
                }
                const json = JSON.stringify(server_info)
                ws_connection.send(json)
                this.emit('log', 'info', 'sending server info to lobby: ' + json)
            }
        }
        ws_connection.onmessage = this.on_ws_message.bind(this)
        ws_connection.onerror = (error) => {
            this.emit('log', 'fail', 'couldn\t connect to lobby: ' + lobby_ip)
            console.log('[GAMELOBBY] websocket onerror')
            console.log(error)
        }
        this.ws_connection = ws_connection
    }

    on_ws_message(e){
        let data = JSON.parse(e.data)
        console.log('[GAMELOBBY] onmessage', data)
        this.emit('log', 'info', 'got message from lobby: ' + e.data)
        switch(data.type){
        case 'id':
            this.id = data.id
            break
        case 'server_list':
            if(this.isclient && this.peer_from_id.size > 0){
                return
            }
            this.emit('server_list', data.servers)
            break
        case 'signal':
            if(!this.peer_from_id.has(data.from_id)){
                this.connect_to(data.from_id)
            }
            this.peer_from_id.get(data.from_id).signal(data.data)
            break
        case 'server':
        default:
            console.err('not implemented',data)
            break
        }
    }
}

module.exports = GameLobby
