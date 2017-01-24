import Debug from '../shared/debug'
import Client from '../client'
import Config from './config'
import Level from './level'
import Input from './client/input'
import Renderer from './client/renderer'

class Cubes extends Client{
    constructor(){
        super(Config)
        this.renderer = new Renderer()
        this.input = new Input()
        this.level = new Level(new Debug(this.statemanager))
        super.on_new_frame(this.render_tick.bind(this))
        this.gamelobby.on('servers',(servers)=>{
            console.log('onservers', servers)
        })
    }

    update_command(command){
        command.left = this.input.isdown(37) || this.input.isdown(65)
        command.up = this.input.isdown(38) || this.input.isdown(87)
        command.right = this.input.isdown(39) || this.input.isdown(68)
        command.down = this.input.isdown(40) || this.input.isdown(83)
        command.mousedown = this.input.mousedown
        command.mousex = this.input.mousex
        command.mousey = this.input.mousey
        this.input.reset()
    }

    render_tick(state, player_id, event){
        let player_entity = -1
        for(const [id, entity] of state.get('player')){
            if(entity.playerid == player_id){
                player_entity = id
            }
        }
        //if(player_entity>=0)
        this.renderer.render(state, this.level, player_entity, this.network.stats)
    }
}

let cubes = new Cubes()
