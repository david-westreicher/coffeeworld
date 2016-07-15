class Debug{
    constructor(statemanager){
        this.debugs = []
        for(let i=0;i<20;i++){
            const [id, debug] = statemanager.create_entity('debug')
            this.debugs.push(debug)
        }
        this.pointer = 0
    }
    debug(x0,y0,x1,y1){
        const debug = this.debugs[this.pointer]
        debug.x0 = x0
        debug.y0 = y0
        debug.x1 = x1
        debug.y1 = y1
        this.pointer = (this.pointer+1)%20
    }
}

module.exports = Debug
