import Game from '../game'
import Renderer from './renderer'

class Cubes extends Game{
    constructor(server){
        super(server)
        this.renderer = new Renderer()
    }

    netcmd_from_input(input){
        let netcmd = 0
        if(input.isdown(37)) // left
            netcmd = netcmd | (1<<0)
        if(input.isdown(38)) // up
            netcmd = netcmd | (1<<1)
        if(input.isdown(39)) // right
            netcmd = netcmd | (1<<2)
        if(input.isdown(40)) // down
            netcmd = netcmd | (1<<3)
        return [netcmd]
    }


    intsperentity(){
        return 2
    }

    entity_state_from_data(data){
        const pos = [0,0]
        pos[0] = data.readInt16LE(0)
        pos[1] = data.readInt16LE(2)
        return pos
    }

    real_tick(){
        this.renderer.render(this.state, this.id)
    }

}

module.exports = Cubes
