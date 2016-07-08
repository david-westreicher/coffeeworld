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
        this.dataview = new DataView(new ArrayBuffer(this.propertycache.size))
    }

    bytes_from_object(object){
        for(const property of this.propertycache.floats){
            this.dataview.setFloat32(this.currentbyte, object[property], true)
            this.currentbyte += Float32Array.BYTES_PER_ELEMENT 
        }

        for(const property of this.propertycache.ints){
            this.dataview.setInt16(this.currentbyte, object[property], true)
            this.currentbyte += Int16Array.BYTES_PER_ELEMENT 
        }

        for(const boolarray of this.propertycache.bools){
            let num = 0
            for(const [property, bitindex] of boolarray){
                if(object[property])
                    num = num | (1 << bitindex)
            }
            this.dataview.setUint8(this.currentbyte, num, true)
            this.currentbyte += Uint8Array.BYTES_PER_ELEMENT 
        }

        return this.dataview.buffer
    }

    set_data(data){
        this.dataview = (!data)?this.dataview:new DataView(data)
        this.currentbyte = 0
    }

    set_data_view(view, currentbyte = 0){
        this.dataview = view
        this.currentbyte = currentbyte
    }

    bytes_per_entity(){
        return this.propertycache.size
    }

    write_int(val){
        this.dataview.setInt16(this.currentbyte, val, true)
        this.currentbyte += Int16Array.BYTES_PER_ELEMENT 
    }

    read_int(){
        const integ = this.dataview.getInt16(this.currentbyte, true)
        this.currentbyte += Int16Array.BYTES_PER_ELEMENT 
        return integ
    }

    update_object_from_data(object){
        for(const property of this.propertycache.floats){
            object[property] = this.dataview.getFloat32(this.currentbyte, true)
            this.currentbyte += Float32Array.BYTES_PER_ELEMENT 
        }

        for(const property of this.propertycache.ints){
            object[property] = this.dataview.getInt16(this.currentbyte, true)
            this.currentbyte += Int16Array.BYTES_PER_ELEMENT 
        }

        for(const boolarray of this.propertycache.bools){
            let num = this.dataview.getUint8(this.currentbyte,true)
            for(const [property, bitindex] of boolarray){
                object[property] = ((num & (1 << bitindex)) > 0)
            }
            this.currentbyte += Uint8Array.BYTES_PER_ELEMENT 
        }

        return object
    }
}

module.exports = ByteEncoder
