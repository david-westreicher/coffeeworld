const GameServer = require('../gameserver')

class CubesServer extends GameServer{

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

    real_tick(evnts){
        for(const evnt of evnts){
            if(!this.state.has(evnt.id))
                continue
            const pos = this.state.get(evnt.id)
            pos[0] += evnt.x
            pos[1] += evnt.y
        }
    }

}

module.exports = CubesServer
