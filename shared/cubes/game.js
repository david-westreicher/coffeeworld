class Cubes{
    constructor(){
        //TODO should be in super
        this.state = new Map()
    }

    /*
     * CLIENT FUNCTIONS
     */

    intsperentity(){
        return 2
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

    entity_state_from_data(data){
        const pos = [0,0]
        pos[0] = data.readInt16LE(0)
        pos[1] = data.readInt16LE(2)
        return pos
    }

    /*
     * SERVER FUNCTIONS
     */

    new_player(id){
        this.state.set(id, [200,200])
    }

    data_from_entity_state(netstate, pos){
        netstate.push(pos[0])
        netstate.push(pos[1])
    }

    event_from_netcmd(data){
        const cmd = data.readInt16LE(0)
        let x = 0
        let y = 0
        if(cmd & (1<<0))
            x -= 1
        if(cmd & (1<<1))
            y -= 1
        if(cmd & (1<<2))
            x += 1
        if(cmd & (1<<3))
            y += 1
        const evnt = {
            x: x,
            y: y,
            type: 'normal'
        }
        return evnt
    }

    tick(evnts){
        for(const evnt of evnts){
            if(!this.state.has(evnt.id))
                continue
            const pos = this.state.get(evnt.id)
            pos[0] += evnt.x
            pos[1] += evnt.y
        }
    }

}

module.exports = Cubes
