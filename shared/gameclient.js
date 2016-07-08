import Game from '../game'
import Input from './input'
import Network from './network'
import Renderer from './renderer'

class Cubes extends Game{
    constructor(){
        super(Network)
        this.renderer = new Renderer()
        this.input = new Input()
    }

    update_command(command){
        command.left = this.input.isdown(37)
        command.up = this.input.isdown(38)
        command.right = this.input.isdown(39)
        command.down = this.input.isdown(40)
    }

    real_tick(state){
        let player_entity = -1
        for(const [id, entity] of state){
            if(entity.playerid == this.playerid){
                player_entity = id
            }
        }
        if(player_entity != -1)
            this.renderer.render(state, player_entity)
    }

}

module.exports = Cubes
