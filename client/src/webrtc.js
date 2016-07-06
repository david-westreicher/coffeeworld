import Peer from 'simple-peer'


class WebRTC {
    constructor(ws, conn_cbk, data_cbk){
        this.arrbuff = new Int16Array(3)
        this.ws = ws
        this.conn_cbk = conn_cbk
        this.data_cbk = data_cbk
    }

    connect(){
        let connection = new WebSocket(this.ws)
        connection.onopen = () => {
            console.log('WEBSOCKET onopen')
            console.log(this)
            this.peer = new Peer()
            this.peer.on('signal', (data) => {
                console.log('WEBRTC onsignal')
                console.log(data)
                connection.send(JSON.stringify(data))
            })
            this.peer.on('connect', () => {
                connection.close()
                this.conn_cbk()
            })
            this.peer.on('data', (data) => {
                this.data_cbk(data)
            })
            this.peer.on('close', () => {
                console.log('WEBRTC onclose')
            })
        }

        connection.onmessage = (e) => {
            console.log('WEBSOCKET onmessage')
            let data = JSON.parse(e.data)
            console.log(data)
            this.peer.signal(data)
        }

        connection.onerror = (error) => {
            console.log(error)
            console.log('WEBSOCKET onerror')
        }
    }

    send(id, pos){
        this.arrbuff[0] = id
        this.arrbuff[1] = pos[0]
        this.arrbuff[2] = pos[1]
        if(this.peer.connected)
            this.peer.send(this.arrbuff)
    }
}

export default WebRTC
