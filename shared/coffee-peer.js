import EventEmitter from 'events'
import adapter from 'webrtc-adapter'

class CoffeePeer extends EventEmitter{
    constructor(args){
        super()
        this.initiator = args.initiator
        this.config = args.config
        this.channelConfig = args.channelConfig
        this.trickle = args.trickle
        this.offerConstraints = args.offerConstraints
        this.start_connection()
    }

    start_connection(){
        const peerconn = new RTCPeerConnection(this.config, {})
        peerconn.onicecandidate = (event) => {
            console.log('on ice candidate callback', event)
            if(event.candidate){
                //TODO sent to other peer
                console.log('on ice candidate', event.candidate)
                this.emit('signal', {
                    type: 'candidate',
                    candidate: event.candidate
                })
            }else{
                console.log('all ice candidates gathered')
            }
        }
        if(this.initiator){
            const datachannel = peerconn.createDataChannel('datachannel', this.channelConfig)
            this.init_datachannel(datachannel)
            peerconn.createOffer().then(
                (desc) => {
                    console.log('offer generated: ' + desc.sdp)
                    peerconn.setLocalDescription(desc)
                    this.emit('signal', {
                        type: 'offer',
                        desc: desc
                    })
                },
                (error) => {
                    console.log('failed to create session description' + error.toString())
                }
            )
        }else{
            peerconn.ondatachannel = (event) => {
                const datachannel = event.channel
                console.log('on data channel',  datachannel)
                this.init_datachannel(datachannel)
            }
        }

        /* deprecated
        peerconn.onaddstream = (){
        }
        */
        peerconn.oniceconnectionstatechange = (event) => {
            console.log('oniceconnectionstatechange', event)

        }
        peerconn.onnegotiationneeded = () => {
            console.log('onnegotiationneeded')
        }
        peerconn.onremovestream = (event) => {
            console.log('onremovestream', event)
        }
        peerconn.onsignallingstatechange = (event) => {
            console.log('onsignallingstatechange', event)
        }
        peerconn.ontrack = (event) => {
            console.log('ontrack', event)
        }



        this.peerconn = peerconn
        console.log('generated peer connection', this.peerconn)
    }

    init_datachannel(datachannel){
        datachannel.binaryType = 'arraybuffer'
        datachannel.onmessage = (event) => {
            this.emit('data', event.data)
            // console.log('got data')
        }
        datachannel.onopen = () => {
            const readyState = datachannel.readyState
            console.log('channel state is: ' + readyState)
            if(readyState === 'open'){
                console.log('channel is open: ', datachannel)
                this.send = datachannel.send.bind(datachannel)
                this.emit('connect')
            }
        }
        datachannel.onclose = (event) => {
            console.log('datachannel closed', event)
        }
        datachannel.onerror = (event) => {
            console.log('datachannel error', event)
        }
        datachannel.onbufferedamountlow = () => {
            console.log('datachannel onbufferedamountlow ')
        }
    }

    signal(data){
        console.log('got signal', data)
        switch(data.type){
        case 'offer':
            this.peerconn.setRemoteDescription(new RTCSessionDescription(data.desc))
            this.peerconn.createAnswer().then(
                (desc) => {
                    this.peerconn.setLocalDescription(desc)
                    console.log('answer for connection: ', desc)
                    this.emit('signal', {
                        type: 'answer',
                        desc: desc
                    })
                },
                (error) => {
                    console.log('failed to create session description' + error.toString())
                }
            )
            break
        case 'candidate':
            this.peerconn.addIceCandidate(data.candidate).then(
                () => {
                    console.log('on add ice candidate success')
                },
                (error) => {
                    console.log('on add ice candidate error', error)
                }
            )
            break
        case 'answer':
            this.peerconn.setRemoteDescription(new RTCSessionDescription(data.desc))
            break
        }
    }
}

module.exports = CoffeePeer
