//import ByteEncoder from './byteencoder'
const ByteEncoder = require('./byteencoder')

class StateManager{
    constructor(network){
        this.network = network
        this.esnap_encoder = new ByteEncoder(network.get_entitysnapshot())
        this.state = new Map()
    }

    update_state(data){
        const newstate = new Map()
        this.esnap_encoder.set_data(data)
        const bytes_per_entity = this.esnap_encoder.bytes_per_entity() + Int16Array.BYTES_PER_ELEMENT // + id
        const num_entities = data.byteLength/bytes_per_entity
        for(let i=0;i<num_entities;i++){
            const id = this.esnap_encoder.read_int()
            const entity = this.state.has(id)?this.state.get(id):this.network.get_entitysnapshot()
            this.esnap_encoder.update_object_from_data(entity)
            newstate.set(id, entity)
        }
        this.state = newstate
    }

    get_snapshot(){
        const bytes_per_entity = this.esnap_encoder.bytes_per_entity() + Int16Array.BYTES_PER_ELEMENT // + id
        const num_entities = this.state.size
        const data = new ArrayBuffer(num_entities*bytes_per_entity)
        this.esnap_encoder.set_data(data)
        for(const [id, entity] of this.state){
            this.esnap_encoder.write_int(id)
            this.esnap_encoder.bytes_from_object(entity)
        }
        return this.esnap_encoder.dataview
    }

    delete_entity(id){
        this.state.delete(id)
    }

    create_entity(){
        const id = this.newid()
        // TODO should reuse entities
        const entity = this.network.get_entitysnapshot()
        this.state.set(id, entity)
        return [entity, id]
    }

    newid(){
        let id = Math.floor(Math.random()*1000)
        while(this.state.has(id)){
            id = Math.floor(Math.random()*1000)
        }
        return id
    }
}


module.exports = StateManager
