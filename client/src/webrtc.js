import Peer from 'simple-peer'


class WebRTC {
    constructor(ws, conn_cbk, data_cbk){
        this.ws = ws
        this.conn_cbk = conn_cbk
        this.data_cbk = data_cbk
    }

    connect(){
        let connection = new WebSocket(this.ws)
        connection.onopen = () => {
            console.log('WEBSOCKET onopen')
            console.log(this)
            this.peer = new Peer({
                initiator: false,
                config: {
                    'iceServers': [ {url: 'stun:stun1.l.google.com:19305'} ]
                },
                trickle: false,
            })
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
            this.peer.on('error', (error) => {
                console.log('WEBRTC onerror', error)
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

    send(id, cmds){
        const arrbuff = new Int16Array(1+cmds.length)
        arrbuff[0] = id
        for(let index=0;index<cmds.length;index++){
            arrbuff[index+1] = cmds[index]
        }
        if(this.peer.connected)
            this.peer.send(arrbuff)
    }
}

export default WebRTC
