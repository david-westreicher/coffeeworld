const MAX_ID = Math.pow(2,16)-1

class Debug{
    constructor(statemanager){
        this.debugs = []
        this.pointer = 0
        for(let i=0;i<20;i++){
            const [id, debug] = statemanager.create_entity('debug')
            this.debugs.push(debug)
        }
    }

    debug(start, end){
        const debug = this.debugs[this.pointer]
        debug.x0 = start[0]
        debug.y0 = start[1]
        debug.x1 = end[0]
        debug.y1 = end[1]
        this.pointer = (this.pointer+1)%this.debugs.length
    }
}

class StateManager{
    constructor(create_entitity_funcs, debug = false){
        this.ids = new Set()
        this.create_entitity_funcs = create_entitity_funcs
        this.state = new Map()
        for(const type in create_entitity_funcs){
            this.state.set(type, new Map())
        }
        console.log(this.create_entitity_funcs)
        if(debug)
            this.debug = new Debug(this)
    }

    delete_entity(id){
        // console.log('delete id:',id)
        //TODO optimize
        for(const state_of_type of this.state.values())
            state_of_type.delete(id)
        this.ids.delete(id)
    }

    create_entity(type){
        const id = this.newid()
        // TODO should reuse entities
        const entity = this.create_entitity_funcs[type]()
        const state_of_type = this.state.get(type)
        state_of_type.set(id, entity)
        //console.log('create entity:',entity,'type',type)
        return [id, entity]
    }

    newid(){
        let id = Math.floor(Math.random()*MAX_ID)
        while(this.ids.has(id)){
            id = Math.floor(Math.random()*MAX_ID)
        }
        this.ids.add(id)
        return id
    }
}


module.exports = StateManager
