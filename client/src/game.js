import WebRTC from './webrtc'
import Config from './game/config'
import ByteEncoder from './shared/byteencoder'
import StateManager from './shared/statemanager'

class Game{
    constructor(network){
        this.playerid = -1
        this.webrtc = new WebRTC(Config.server_ip, this.ondata.bind(this))
        this.webrtc.connect()
        this.command = network.get_command()
        this.command.playerid = 0 // we have to send the playerid too
        this.command_encoder = new ByteEncoder(this.command)
        this.statemanager = new StateManager(network)
        setInterval(this.send_cmd_to_server.bind(this),1000/Config.client_tickrate)
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

    tick(){
        this.real_tick(this.statemanager.state)
    }

}

export default Game
