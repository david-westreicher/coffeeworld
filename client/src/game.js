import Config from './config'
import WebRTC from './webrtc'

class Game{
    constructor(){
        this.id = -1
        this.state = new Map()
        this.webrtc = new WebRTC(Config.server,
            () => {},
            this.ondata.bind(this)
        )
        this.webrtc.connect()
    }

    ondata(data){
        if(this.id==-1){
            this.id = data.readInt32LE(0)
            console.log('id: ', this.id)
            return
        }
        const intsperplayer = 3 // id: 1, pos: 2
        const bytes_per_int = 2
        const players = (data.length/intsperplayer)/bytes_per_int
        this.state = new Map()
        for(let i=0; i<players; i++){
            const offset = i*intsperplayer*bytes_per_int
            const id = data.readInt16LE(offset+0*bytes_per_int)
            const entity_state_data = data.slice(offset+1*bytes_per_int, offset+intsperplayer*bytes_per_int)
            this.state.set(id, this.entity_state_from_data(entity_state_data))
        }
    }

    send_to_server(){
        if(this.id==-1)
            return
        this.webrtc.send(this.id, this.get_cmd())
    }

    tick(){
        throw 'NotImplemented'
    }

    render(){
        throw 'NotImplemented'
    }

    get_cmd(){
        throw 'NotImplemented'
    }

    entity_state_from_data(data){
        throw 'NotImplemented'
    }
}

export default Game
