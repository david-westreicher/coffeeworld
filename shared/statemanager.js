//import ByteEncoder from './byteencoder'
const ByteEncoder = require('./byteencoder')

const id_type = Uint16Array
const id_bytes = id_type.BYTES_PER_ELEMENT
const id_max = Math.pow(2,16)-1

const entity_num_bytes = Uint8Array.BYTES_PER_ELEMENT

class StateManager{
    constructor(create_entitity_funcs){
        this.ids = new Set()
        this.create_entitity_funcs = create_entitity_funcs
        this.encoder_map = new Map()
        this.state = new Map()
        for(const type in create_entitity_funcs){
            const create_entity_of_type = create_entitity_funcs[type]
            this.encoder_map.set(type, new ByteEncoder(create_entity_of_type()))
            this.state.set(type, new Map())
        }
        console.log(this.encoder_map)
        console.log(this.create_entitity_funcs)
    }

    update_state(data){
        //TODO reuse states with ring buffer
        const newstate = new Map()

        const view = new DataView(data)
        let currentbyte = 0
        for(const [type, encoder] of this.encoder_map){
            encoder.set_data_view(view, currentbyte)
            const num_entities = encoder.read_uint8()
            const newstate_of_type = new Map()
            const state_of_type = this.state.get(type)
            for(let i=0;i<num_entities;i++){
                const id = encoder.read_uint16()
                const entity = state_of_type.has(id)?state_of_type.get(id):this.create_entitity_funcs[type]()
                encoder.update_object_from_data(entity)
                newstate_of_type.set(id, entity)
            }
            newstate.set(type,newstate_of_type)

            currentbyte += this.bytes_used(encoder, num_entities)
        }

        this.state = newstate
    }

    get_snapshot(){
        let num_bytes = 0
        for(const [type, encoder] of this.encoder_map){
            const num_entities = this.state.get(type).size
            num_bytes += this.bytes_used(encoder, num_entities)
        }
        const data = new ArrayBuffer(num_bytes)
        const view = new DataView(data)
        let currentbyte = 0
        for(const [type, encoder] of this.encoder_map){
            const state_of_type = this.state.get(type)
            const num_entities = state_of_type.size
            encoder.set_data_view(view, currentbyte)
            encoder.write_uint8(num_entities)
            for(const [id, entity] of state_of_type){
                encoder.write_uint16(id)
                encoder.bytes_from_object(entity)
            }
            currentbyte += this.bytes_used(encoder, num_entities)
        }
        // console.log('sending', this.state)
        // console.log('sending', view)
        // console.log('sending', num_bytes)
        return view
    }

    bytes_used(encoder, num_entities){
        const bytes_per_entity = encoder.bytes_per_entity() + id_bytes
        return  bytes_per_entity*num_entities + entity_num_bytes
    }

    delete_entity(id){
        // console.log('delete id:',id)
        //TODO optimize
        for(const state_of_type of this.state.values())
            state_of_type.delete(id)
        this.ids.add(id)
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
        let id = Math.floor(Math.random()*id_max)
        while(this.ids.has(id)){
            id = Math.floor(Math.random()*id_max)
        }
        this.ids.add(id)
        return id
    }
}


module.exports = StateManager
