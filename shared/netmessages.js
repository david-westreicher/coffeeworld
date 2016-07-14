const ByteEncoder= require('./byteencoder')
const MSG_PLAYERID_BYTES = 1
const MSG_TYPE_BYTES = 1

class MessagePlayerid{
    constructor(msgid){
        this.buf = new Buffer(MSG_TYPE_BYTES + MSG_PLAYERID_BYTES) //msgtype + playerid
        this.buf.writeUInt8(msgid,0)
    }
    encode(playerid){
        this.buf.writeUInt8(playerid,MSG_TYPE_BYTES)
    }
    decode(buffer){
        return buffer.readUInt8(MSG_TYPE_BYTES)
    }
}

class MessagePing{
    constructor(msgid){
        this.buf = new Buffer(MSG_TYPE_BYTES + 4) //msgtype + time
        this.buf.writeUInt8(msgid,0)
    }
    encode(time){
        if(!time){
            time = window.performance.now()
        }
        this.buf.writeFloatLE(time,MSG_TYPE_BYTES)
    }
    decode(buffer){
        return buffer.readFloatLE(MSG_TYPE_BYTES)
    }
}

class MessageCmd{
    constructor(msgid, command){
        this.command_encoder = new ByteEncoder(command)
        this.buf = new Buffer(MSG_TYPE_BYTES + MSG_PLAYERID_BYTES + this.command_encoder.bytes_per_entity())
        this.buf.writeUInt8(msgid,0)
        this.command_encoder.set_buffer(this.buf)
    }
    encode(playerid, cmd){
        this.buf.writeUInt8(playerid,MSG_TYPE_BYTES)
        this.command_encoder.set_offset(MSG_TYPE_BYTES + MSG_PLAYERID_BYTES)
        this.command_encoder.write(cmd)
    }
    decode(buffer, cmd){
        const playerid = buffer.readUInt8(MSG_TYPE_BYTES)
        this.command_encoder.set_buffer(buffer)
        this.command_encoder.set_offset(MSG_TYPE_BYTES + MSG_PLAYERID_BYTES)
        this.command_encoder.read(cmd)
        return playerid
    }
}

class MessageState{
    constructor(msgid, create_entitity_funcs){
        this.origbuf = new Buffer(1500)
        this.origbuf.writeUInt8(msgid,0)
        this.create_entitity_funcs = create_entitity_funcs
        this.encoder_map = new Map()
        for(const type in create_entitity_funcs){
            const create_entity_of_type = create_entitity_funcs[type]
            const encoder = new ByteEncoder(create_entity_of_type())
            console.log(encoder)
            encoder.set_buffer(this.origbuf)
            this.encoder_map.set(type, encoder)
        }
    }
    encode(state){
        let offset = MSG_TYPE_BYTES
        for(const [type, encoder] of this.encoder_map){
            const state_of_type = state.get(type)
            const num_entities = state_of_type.size
            if(offset>=1500)
                break
            this.origbuf.writeUInt8(num_entities, offset++)
            for(const [id, entity] of state_of_type){
                if(offset>=1500)
                    break
                this.origbuf.writeUInt16LE(id, offset)
                offset+=2
                encoder.set_offset(offset)
                encoder.write(entity)
                offset = encoder.offset
            }
        }
        this.buf = this.origbuf.slice(0,offset)
    }
    decode(buffer, oldstate){
        const newstate = new Map()
        let offset = MSG_TYPE_BYTES
        for(const [type, encoder] of this.encoder_map){
            const num_entities = buffer.readUInt8(offset++)
            const newstate_of_type = new Map()
            const state_of_type = oldstate.get(type)
            encoder.set_buffer(buffer)
            encoder.set_offset(offset)
            for(let i=0;i<num_entities;i++){
                const id = buffer.readUInt16LE(offset)
                offset+=2
                encoder.set_offset(offset)
                const entity = state_of_type.has(id)?state_of_type.get(id):this.create_entitity_funcs[type]()
                encoder.read(entity)
                newstate_of_type.set(id, entity)
                offset = encoder.offset
            }
            newstate.set(type,newstate_of_type)
        }
        return newstate
    }
}

module.exports.MessagePlayerid = MessagePlayerid
module.exports.MessagePing = MessagePing
module.exports.MessageCmd = MessageCmd
module.exports.MessageState = MessageState
