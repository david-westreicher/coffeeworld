import { DummyLobby, ClientServerConnect } from './shared/dummy'
import Server from './shared/server'
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

        this.gamelobby = config.local_play ? new DummyLobby() : new GameLobby(true, config.lobby_ip, config.stun_ip)
        this.gamelobby.on('server_list',(servers)=>{
            if(servers.length == 0)
                return
            this.gamelobby.connect_to(servers[servers.length-1].id)
        })
        this.gamelobby.on('peer',(server_peer) => {
            console.log('new server_peer',server_peer)
            this.network.connect(true, server_peer)
            const tickrate = 1000/config.client_tickrate
            this.tick_task = new AccurateTimer(this.tick.bind(this), tickrate)
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
            this.server = new Server()
            this.server.on('log', (type, text)=>{
                console.log('[SERVER] '+type+': '+text)
            })
            ClientServerConnect(this, this.server)
        }
    }
    
    tick(){
        this.update_command(this.command)
        this.network.send_cmd(this.command, this.player_id)
        //if(this.server)
            //this.server._tick()
    }

    on_new_frame(fun){
        const main = (event) => {
            window.requestAnimationFrame(main)
            fun(this.statemanager.state, this.player_id, event)
            if(this.server)
                this.server._tick()
        }
        main()
    }
}

export default Game
