import WebRTC from './webrtc'
import ByteEncoder from './shared/byteencoder'
import StateManager from './shared/statemanager'

class Game{
    constructor(config){
        this.command = config.get_command()
        this.command.playerid = 0 // we have to send the playerid too
        this.command_encoder = new ByteEncoder(this.command)

        this.statemanager = new StateManager(config.get_entitysnapshot)
        this.webrtc = new WebRTC(config.server_ip, this.ondata.bind(this))
        this.tickrate = 1000/config.client_tickrate
        this.playerid = -1
    }

    connect(){
        setInterval(this.send_cmd_to_server.bind(this), this.tickrate)
        this.webrtc.connect()
    }

    ondata(data){
        if(this.playerid==-1){
            this.playerid = data.readInt16LE(0)
            console.log('playerid: ', this.playerid)
            return
        }
        this.statemanager.update_state(data.buffer)
    }

    send_cmd_to_server(){
        if(this.playerid==-1)
            return
        this.update_command(this.command)
        this.command.playerid = this.playerid
        this.command_encoder.set_data()
        const bytes = this.command_encoder.bytes_from_object(this.command)
        this.webrtc.send(bytes)
    }

    on_new_frame(fun){
        const main = () => {
            window.requestAnimationFrame(main)
            fun(this.statemanager.state)
        }
        main()
    }
}

export default Game
