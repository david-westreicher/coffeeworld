import WebRTC from './webrtc'
import Input from './input'

class Game{
    constructor(server){
        this.id = -1
        this.input = new Input()
        //TODO remove empty callback from webrtc
        this.webrtc = new WebRTC(server,
            () => {},
            this.ondata.bind(this)
        )
        this.webrtc.connect()
        this.state = new Map()
    }

    ondata(data){
        if(this.id==-1){
            this.id = data.readInt32LE(0)
            console.log('id: ', this.id)
            return
        }

        const intsperentity = 1 + this.intsperentity()
        const bytes_per_int = 2
        const players = (data.length/intsperentity)/bytes_per_int
        const newstate = new Map()
        for(let i=0; i<players; i++){
            const offset = i*intsperentity*bytes_per_int
            const id = data.readInt16LE(offset + 0*bytes_per_int)
            const entity_state_data = data.slice(offset + 1*bytes_per_int, offset + intsperentity*bytes_per_int)
            newstate.set(id, this.entity_state_from_data(entity_state_data))
        }
        this.state = newstate
    }

    send_cmds_to_server(){
        if(this.id==-1)
            return
        const cmds = this.netcmd_from_input(this.input)
        this.webrtc.send(this.id, cmds)
    }

    tick(){
        this.send_cmds_to_server()
        this.real_tick()
    }

}

export default Game
