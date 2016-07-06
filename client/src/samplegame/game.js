import Game from '../game'
import Input from '../input'
import Renderer from './renderer'

class SampleGame extends Game{
    constructor(){
        super()
        this.pos = [200,200]
        this.renderer = new Renderer()
        this.input = new Input()
    }

    tick(){
        const dir = [0,0]
        if(this.input.isdown(37)) // left
            dir[0] = -1
        if(this.input.isdown(38)) // up
            dir[1] = -1
        if(this.input.isdown(39)) // right
            dir[0] = 1
        if(this.input.isdown(40)) // down
            dir[1] = 1
        this.pos[0] += dir[0]
        this.pos[1] += dir[1]
    }

    render(){
        this.renderer.render(this.state, this.id)
    }

    get_cmd(){
        return this.pos
    }

    entity_state_from_data(data){
        const pos = [0,0]
        pos[0] = data.readInt16LE(0)
        pos[1] = data.readInt16LE(2)
        return pos
    }
}

export default SampleGame
