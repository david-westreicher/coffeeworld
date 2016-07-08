const GameServer = require('../gameserver')
const Network = require('./network')

class CubesServer extends GameServer{
    constructor(){
        super(Network)
        this.entityid_from_playerid = new Map()
    }

    new_player(playerid){
        const [entity, id] = this.statemanager.create_entity()
        entity.playerid = playerid
        console.log('new entity ', entity)
        this.entityid_from_playerid.set(playerid, id)
    }

    player_left(playerid){
        const entityid = this.entityid_from_playerid.get(playerid)
        this.statemanager.delete_entity(entityid)
    }

    real_tick(state, cmds){
        for(const cmd of cmds){
            const entity = state.get(this.entityid_from_playerid.get(cmd.playerid))
            const dir = [0,0]
            dir[0]+=cmd.right?1:0
            dir[0]-=cmd.left?1:0
            dir[1]+=cmd.down?1:0
            dir[1]-=cmd.up?1:0
            entity.x += dir[0]
            entity.y += dir[1]
        }
    }

}

module.exports = CubesServer
