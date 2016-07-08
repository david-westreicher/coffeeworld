const GameServer = require('../gameserver')
const Config = require('./config')
const vec2 = require('gl-matrix').vec2

class CubesServer extends GameServer{
    constructor(){
        super(Config)
        this.entityid_from_playerid = new Map()
        this.bullets = new Set()
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

    tick(state, cmds){
        for(const cmd of cmds){
            const entity = state.get(this.entityid_from_playerid.get(cmd.playerid))
            const dir = [0,0]
            dir[0]+=cmd.right?1:0
            dir[0]-=cmd.left?1:0
            dir[1]+=cmd.down?1:0
            dir[1]-=cmd.up?1:0
            entity.x += dir[0]*10
            entity.y += dir[1]*10
            if(cmd.mousedown){
                const [bullet, id] = this.statemanager.create_entity()
                bullet.x = entity.x
                bullet.y = entity.y
                bullet.speed = vec2.fromValues(cmd.mousex-bullet.x, cmd.mousey-bullet.y)
                vec2.normalize(bullet.speed, bullet.speed)
                vec2.scale(bullet.speed, bullet.speed, 20.0)
                bullet.id = id
                this.bullets.add(bullet)
            }
        }
        for(const bullet of this.bullets){
            bullet.speed[1] += 1
            bullet.x += bullet.speed[0]
            bullet.y += bullet.speed[1]
            if(bullet.y>400 || bullet.x>400 || bullet.y<0 || bullet.x<0){
                this.bullets.delete(bullet)
                this.statemanager.delete_entity(bullet.id)
            }
        }
    }

}

module.exports = CubesServer
