import Client from '../client'
import Config from './config'
import Input from './client/input'
import Renderer from './client/renderer'

class Cubes extends Client{
    constructor(){
        super(Config)
        this.renderer = new Renderer()
        this.input = new Input()
        super.on_new_frame(this.tick.bind(this))
    }

    update_command(command){
        command.left = this.input.isdown(37)
        command.up = this.input.isdown(38)
        command.right = this.input.isdown(39)
        command.down = this.input.isdown(40)
        command.mousedown = this.input.mousedown
        command.mousex = this.input.mousex
        command.mousey = this.input.mousey
    }

    tick(state){
        let player_entity = -1
        for(const [id, entity] of state.get('player')){
            if(entity.playerid == this.playerid){
                player_entity = id
            }
        }
        this.renderer.render(state.get('player'), player_entity, state.get('bullet'))
    }
}

let cubes = new Cubes()
cubes.connect()
