import Client from '../client'
import Input from './input'
import Network from './network'
import Renderer from './renderer'

class Cubes extends Client{
    constructor(){
        super(Network)
        this.renderer = new Renderer()
        this.input = new Input()
        super.on_new_frame(this.tick.bind(this))
    }

    update_command(command){
        command.left = this.input.isdown(37)
        command.up = this.input.isdown(38)
        command.right = this.input.isdown(39)
        command.down = this.input.isdown(40)
    }

    tick(){
        const state = this.statemanager.state
        let player_entity = -1
        for(const [id, entity] of state){
            if(entity.playerid == this.playerid){
                player_entity = id
            }
        }
        this.renderer.render(state, player_entity)
    }
}

let cubes = new Cubes()
cubes.connect()
