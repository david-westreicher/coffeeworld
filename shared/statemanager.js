const MAX_ID = Math.pow(2,16)-1

class StateManager{
    constructor(create_entitity_funcs){
        this.ids = new Set()
        this.create_entitity_funcs = create_entitity_funcs
        this.state = new Map()
        for(const type in create_entitity_funcs){
            this.state.set(type, new Map())
        }
        console.log(this.create_entitity_funcs)
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
