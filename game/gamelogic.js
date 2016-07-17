const Level = require('./level')
const vec2 = require('gl-matrix').vec2

const PLAYER_SIZE = 10
const HOOK_SPEED = 8
const HOOK_MAX_LENGTH = 800

class GameLogic{
    constructor(){
        this.entityid_from_playerid = new Map()
        this.level = new Level()
    }

    new_player(statemanager, playerid){
        const [id, player] = statemanager.create_entity('player')
        player.playerid = playerid
        this.init_player(player)
        this.entityid_from_playerid.set(playerid, id)
        console.log('new player ', player)
    }

    init_player(player){
        player.x = 0
        player.y = 0
        player.hookx = 0
        player.hooky = 0
        player.hook_pos = vec2.fromValues(0.0,0.0)
        player.hook_length = 0
        player.pos = vec2.fromValues(0.0,0.0)
        player.lastpos = vec2.fromValues(0.0,0.0)
    }

    player_left(statemanager, playerid){
        const entityid = this.entityid_from_playerid.get(playerid)
        statemanager.delete_entity(entityid)
    }

    tick(statemanager,  cmds){
        for(const cmd of cmds){
            const player = statemanager.state.get('player').get(this.entityid_from_playerid.get(cmd.playerid))
            if(!player)
                continue
            if(cmd.up)
                this.init_player(player)
            if(player.hook_length==0 && cmd.mousedown){
                const collpos = this.level.raycast(player.pos, vec2.fromValues(cmd.mousex, cmd.mousey))
                vec2.copy(player.hook_pos, collpos)
                player.hook_length = vec2.distance(player.hook_pos,player.pos)
            }
            if(player.hook_length!=0){
                if(cmd.left)
                    player.hook_length = Math.max(80, player.hook_length-HOOK_SPEED)
                if(cmd.right)
                    player.hook_length = Math.min(HOOK_MAX_LENGTH, player.hook_length+HOOK_SPEED)
            }
            if(!cmd.mousedown || player.hook_length>HOOK_MAX_LENGTH)
                player.hook_length = 0
        }

        const players = Array.from(statemanager.state.get('player').values())
        this.physic_statisfy_constraints(players)
        this.physic_verlet_integration(players)
        this.physic_world_collision(players)
        this.physic_serialize(players)
    }

    physic_statisfy_constraints(players){
        const diff = vec2.fromValues(0.0,0.0)
        const translate = vec2.fromValues(0.0,0.0)
        for(let player of players){
            const linkdist = player.hook_length
            if(player.hook_length == 0){
                vec2.copy(player.hook_pos, player.pos)
                continue
            }
            vec2.sub(diff, player.pos, player.hook_pos)
            const d = vec2.length(diff)
            const difference = 0.4*(linkdist-d)/d
            vec2.scale(translate, diff, difference)
            vec2.add(player.pos, player.pos, translate)
        }
    }

    physic_verlet_integration(players){
        const velocity = vec2.fromValues(0.0,0.0)
        const nextpos = vec2.fromValues(0.0,0.0)
        const accel = vec2.fromValues(0.0,1.0)
        for(let player of players){
            vec2.sub(velocity, player.pos, player.lastpos)
            vec2.add(nextpos, player.pos, velocity)
            vec2.scaleAndAdd(nextpos, nextpos, accel, 0.5)
            vec2.copy(player.lastpos, player.pos)
            vec2.copy(player.pos, nextpos)
        }
    }

    physic_world_collision(players){
        for(let player of players){
            this.level.collide(player, PLAYER_SIZE)
        }
    }

    physic_serialize(players){
        for(let player of players){
            player.x = player.pos[0]
            player.y = player.pos[1]
            player.hookx = player.hook_pos[0]
            player.hooky = player.hook_pos[1]
        }
    }

}

module.exports = GameLogic
