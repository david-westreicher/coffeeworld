//TODO no nesting allowed
// only can encode bools/ints/floats
class PropertyCache{
    constructor(object){
        this.size = 0
        this.floats = []
        this.ints = []
        this.bools = []
        this.addProperties(object, null)
    }

    addProperties(object, propname){
        switch (typeof object) {
        case 'object':
            for(let property in object){
                this.addProperties(object[property], property)
            }
            break
        case 'number':
            if(object.toString().indexOf('.')>-1){
                this.floats.push(propname)
                this.size += Float32Array.BYTES_PER_ELEMENT
            }else{
                this.ints.push(propname)
                this.size += Int16Array.BYTES_PER_ELEMENT
            }
            break
        case 'boolean':{
            if(this.bools.length == 0 || this.bools[0].size == Uint8Array.BYTES_PER_ELEMENT*8){
                this.bools.unshift(new Map())
                this.size += Uint8Array.BYTES_PER_ELEMENT
            }
            const bitmap = this.bools[0]
            bitmap.set(propname, bitmap.size)
            break
        }
        default: 
            console.log(new Error().stack)
            throw 'Encoding of type ' + (typeof object) + ' not supported'
        } 
    }
}

class ByteEncoder{
    constructor(object){
        this.propertycache = new PropertyCache(object)
    }

    set_buffer(buf){
        this.buf = buf
        this.offset = 0
    }

    set_offset(offset){
        this.offset = offset
    }

    write(object){
        for(const property of this.propertycache.floats){
            this.buf.writeFloatLE(object[property], this.offset, true)
            this.offset += Float32Array.BYTES_PER_ELEMENT
        }

        for(const property of this.propertycache.ints){
            this.buf.writeInt16LE(object[property], this.offset, true)
            this.offset += Int16Array.BYTES_PER_ELEMENT
        }

        for(const boolarray of this.propertycache.bools){
            let num = 0
            for(const [property, bitindex] of boolarray){
                if(object[property])
                    num = num | (1 << bitindex)
            }
            this.buf.writeUInt8(num, this.offset, true)
            this.offset += Uint8Array.BYTES_PER_ELEMENT
        }
    }

    read(object){
        for(const property of this.propertycache.floats){
            object[property] = this.buf.readFloatLE(this.offset, true)
            this.offset += Float32Array.BYTES_PER_ELEMENT
        }

        for(const property of this.propertycache.ints){
            object[property] = this.buf.readInt16LE(this.offset, true)
            this.offset += Int16Array.BYTES_PER_ELEMENT
        }

        for(const boolarray of this.propertycache.bools){
            let num = this.buf.readUInt8(this.offset,true)
            for(const [property, bitindex] of boolarray){
                object[property] = ((num & (1 << bitindex)) > 0)
            }
            this.offset += Uint8Array.BYTES_PER_ELEMENT
        }

        return object
    }

    bytes_per_entity(){
        return this.propertycache.size
    }
}

module.exports = ByteEncoder
