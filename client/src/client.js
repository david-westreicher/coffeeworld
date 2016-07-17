import Server from './game/server'
import WebRTC from './webrtc'
import GameLobby from './shared/gamelobby'
import AccurateTimer from './shared/util'
import NetworkLayer from './shared/networklayer'
import StateManager from './shared/statemanager'

class Game{
    constructor(config){
        this.statemanager = new StateManager(config.get_entities)
        this.command = config.get_command()
        this.network = NetworkLayer.createClient(config)
        this.network.on('state', (state) => {
            // console.log('got new state', state)
            this.statemanager.state = state
        })
        this.network.on('player_id', (player_id) => {
            console.log('got player_id', player_id)
            this.player_id = player_id
        })

        this.gamelobby = new GameLobby(true, config.lobby_ip)
        this.gamelobby.on('server_list',(servers)=>{
            if(servers.length == 0)
                return
            this.gamelobby.connect_to(servers[servers.length-1].id)
        })
        this.gamelobby.on('peer',(server_peer) => {
            console.log('new server_peer',server_peer)
            this.network.connect(true, server_peer)
            const tickrate = 1000/config.client_tickrate
            this.tick_task = new AccurateTimer(this.tick.bind(this),
                    tickrate,
                    window.performance.now.bind(window.performance))
            this.tick_task.start()
        })
        this.gamelobby.on('peer_left',(server_peer) => {
            console.log('disconnected from server')
            if(!this.tick_task)
                return
            this.tick_task.stop()
            this.tick_task = null
        })

        if(config.local_play){
            // TODO fix local play
            const serverrate = 1000/config.server_tickrate
            this.start_local_server(serverrate)
        }
    }
    
    tick(){
        this.update_command(this.command)
        this.network.send_cmd(this.command, this.player_id)
    }

    start_local_server(tickrate){
        this.server = new Server()
        this.server.statemanager = this.statemanager
        this.server.new_player(123)
        this.network.playerid = 123
        this.command.playerid=123
        const timer = new AccurateTimer(()=>{
            this.update_command(this.command)
            this.server.tick(this.statemanager.state, [this.command])
        }, tickrate, window.performance.now.bind(window.performance))
        timer.start()
    }

    send_cmd_to_server(){
    }

    on_new_frame(fun){
        const main = (event) => {
            window.requestAnimationFrame(main)
            fun(this.statemanager.state, this.player_id, event)
        }
        main()
    }
}

export default Game
