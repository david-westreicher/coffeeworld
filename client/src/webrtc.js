import Peer from 'simple-peer'


class WebRTC {
    constructor(ws){
        this.ws = ws
        this.data_cbk = ()=>{}
        this.servers = []
    }

// server list
//  {
//      type: 'server_list',
//      servers: [
//          {
//              id: 123,
//              name: 'bla'
//          },
//      ]
//  }
// server:
//  {
//      type: 'server',
//      name: 'bla',
//  }
//
// signal:
//  {
//      to_id: 'serverid',
//      from_id: 'clientid',
//      data: sdp-data,
//  }
    connect(){
        this.connection = new WebSocket(this.ws)
        this.connection.onopen = () => {
            console.log('WEBSOCKET onopen')
            console.log(this)
        }

        this.connection.onmessage =this.onmessage.bind(this)

        this.connection.onerror = (error) => {
            console.log(error)
            console.log('WEBSOCKET onerror')
        }
    }

    onmessage(e){
        let data = JSON.parse(e.data)
        console.log('WEBSOCKET onmessage', data)
        switch(data.type){
        case 'server_list':
            this.servers = data.servers
            break
        case 'signal':
            this.peer.signal(data.data)
            break
        case 'server':
        default:
            console.err('not implemented',data)
            break
        }
    }

    connect_to_id(server_id){
        this.peer = new Peer({
            initiator: true,
            config: {
                'iceServers': [ {
                    url: 'stun:stun4.l.google.com:19302',
                    urls: 'stun:stun4.l.google.com:19302'
                } ]
            },
            trickle: false,
        })
        this.peer.on('signal', (data) => {
            console.log('WEBRTC onsignal')
            console.log(data)
            this.connection.send({
                to_id: server_id,
                data: JSON.stringify(data),
            })
        })
        this.peer.on('connect', () => {
            this.connection.close()
        })
        this.peer.on('data', (data) => {
            this.data_cbk(data)
        })
        this.peer.on('error', (error) => {
            console.log('WEBRTC onerror', error)
        })
        this.peer.on('close', () => {
            console.log('WEBRTC onclose')
        })
    }

    ondata(data_cbk){
        this.data_cbk = data_cbk
    }

    send(buffer){
        if(this.peer && this.peer.connected)
            this.peer.send(buffer)
    }

}

export default WebRTC
