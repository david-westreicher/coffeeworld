import Server from './game/server'
import WebRTC from './webrtc'
import AccurateTimer from './shared/util'
import NetworkLayer from './shared/networklayer'
import StateManager from './shared/statemanager'

class Game{
    constructor(config){
        this.statemanager = new StateManager(config.get_entities)
        this.command = config.get_command()
        this.network = NetworkLayer.createClient(this.statemanager, this.command, config.get_entities)
        if(config.local_play){
            const serverrate = 1000/config.server_tickrate
            this.start_local_server(serverrate)
        }else{
            const tickrate = 1000/config.client_tickrate
            this.connect_dedicated(config.server_ip,tickrate)
        }
    }

    start_local_server(tickrate){
        this.server = new Server()
        this.server.statemanager = this.statemanager
        this.server.new_player(123)
        this.playerid = 123
        this.command.playerid=123
        const timer = new AccurateTimer(()=>{
            this.update_command(this.command)
            this.server.tick(this.statemanager.state, [this.command])
        }, tickrate, window.performance.now.bind(window.performance))
        timer.start()
    }

    connect_dedicated(ip,tickrate){
        this.webrtc = new WebRTC(ip)
        this.network.on_playerid = (playerid)=>{
            this.playerid = playerid
        }
        this.network.connect(this.webrtc)
        const timer = new AccurateTimer(this.send_cmd_to_server.bind(this),tickrate,window.performance.now.bind(window.performance))
        timer.start()
    }

    send_cmd_to_server(){
        this.update_command(this.command)
        this.network.send_cmd(this.command)
    }

    on_new_frame(fun){
        const main = (event) => {
            window.requestAnimationFrame(main)
            fun(this.statemanager.state, event)
        }
        main()
    }
}

export default Game
