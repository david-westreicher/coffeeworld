const Level = require('./level')
const vec2 = require('gl-matrix').vec2
const normal_from_points = require('./util').normal_from_points

const HOOK_SPEED = 10
const HOOK_MAX_LENGTH = 800
const MAX_FOOD = 100
const GRAVITY = vec2.fromValues(0.0,-0.5)


class GameLogic{
    constructor(statemanager){
        this.debug = statemanager.debug
        this.statemanager = statemanager
        this.entityid_from_playerid = new Map()
        this.level = new Level(this.debug)
        this.tick_count = 0
        this.foods = []
        this.players = []
    }

    new_player(playerid){
        const [id, player] = this.statemanager.create_entity('player')
        player.playerid = playerid
        this.init_player(player, id)
        this.players.push(player)
        this.entityid_from_playerid.set(playerid, id)
        console.log('new player ', player)
    }

    init_player(player, id){
        player.x = 0
        player.y = 0
        player.hookx = 0
        player.hooky = 0
        player.size = 20
        player.hook_pos = vec2.fromValues(0.0,0.0)
        player.hook_length = 0
        player.pos = vec2.fromValues(0.0,0.0)
        player.lastpos = vec2.fromValues(0.0,0.0)
        player.id = id
    }

    player_left(playerid){
        const entityid = this.entityid_from_playerid.get(playerid)
        this.statemanager.delete_entity(entityid)

        let index = -1
        for(const player of this.players){
            if(player.id == entityid)
                break
            index++
        }
        if(index!=-1) this.players.splice(index,1)
    }

    tick(cmds){
        for(const cmd of cmds){
            const player = this.statemanager.state.get('player').get(this.entityid_from_playerid.get(cmd.playerid))
            if(!player)
                continue
            if(cmd.up)
                this.init_player(player)
            if(player.hook_length==0 && cmd.mousedown){
                const collpos = this.level.raycast(player.pos, vec2.fromValues(cmd.mousex, -cmd.mousey))
                player.hook_length = vec2.distance(collpos, player.pos)
                vec2.copy(player.hook_pos, collpos)
                if(player.hook_length>HOOK_MAX_LENGTH){
                    player.hook_length = 0
                    const diff = vec2.create()
                    vec2.sub(diff, collpos, player.pos)
                    vec2.scaleAndAdd(player.hook_pos, player.pos, diff, HOOK_MAX_LENGTH/vec2.length(diff))
                }
            }
            if(player.hook_length!=0){
                if(cmd.left)
                    player.hook_length = Math.max(player.size, player.hook_length-HOOK_SPEED)
                if(cmd.right)
                    player.hook_length = Math.min(HOOK_MAX_LENGTH, player.hook_length+HOOK_SPEED)
            }
            if(!cmd.mousedown){
                player.hook_length = 0
                vec2.copy(player.hook_pos, player.lastpos)
            }
        }

        this.physic_statisfy_constraints()
        this.physic_verlet_integration()
        this.physic_world_collision()

        this.spawn_food()
        this.physic_food_collisions()

        this.physic_serialize()
        this.tick_count++
    }

    spawn_food(){
        //if((this.tick_count % 100) == 0 && this.foods.length < 50){
        while(this.foods.length < MAX_FOOD){
        //if(false){
            const [id, food] = this.statemanager.create_entity('food')
            food.x = Math.random()*this.level.size*2-this.level.size
            food.y = Math.random()*this.level.size*2-this.level.size
            food.pos = vec2.fromValues(food.x, food.y)
            food.size = Math.random()*40 + 10
            food.id = id
            this.foods.push(food)
        }
    }

    physic_food_collisions(){
        const r0 = vec2.create()
        const r1 = vec2.create()
        const nr = vec2.create()
        const l0 = vec2.create()
        const l1 = vec2.create()
        const nl = vec2.create()


        for(const player of this.players){
            for(const food of this.foods){
                if(vec2.distance(player.pos, food.pos) < (player.size+food.size)){
                    // touches player
                    this.eat_food(player, food)
                }else if(vec2.distance(player.hook_pos, food.pos) < player.hook_length){
                    // possibly touches line
                    //
                    // convert hook_pos/lastpos/pos to hitbox (convex polygon)
                    // by extruding the triangle sides  with the size of food
                    // check if food is in polygon
                    //                                             
                    //       hook_pos                         l1     r0   
                    //                                         +-----+
                    //          *                             /   *   \
                    //         / \                           /   / \   \
                    //        /   \           --->          /   /   \   \
                    //       /     \                       /   /     \   \
                    //      *       *                     /   /       \   \
                    //   lastpos    pos               l0 +   /         \   + r1
                    //                                    \ /           \ /
                    //                                     *-------------*
                    //                                  lastpos          pos
                    //                                            |
                    //                                            |  < nb
                    //                                            v
                    normal_from_points(player.hook_pos, player.pos, nr)
                    normal_from_points(player.lastpos, player.hook_pos, nl)
                    vec2.scaleAndAdd(r0, player.hook_pos, nr, food.size)
                    vec2.scaleAndAdd(r1, player.pos, nr, food.size)
                    vec2.scaleAndAdd(l0, player.lastpos, nl, food.size)
                    vec2.scaleAndAdd(l1, player.hook_pos, nl, food.size)
                    if(this.debug && this.tick_count%5==0){
                        this.debug.debug(l1, r0)
                        this.debug.debug(r0, r1)
                        this.debug.debug(r1, player.pos)
                        this.debug.debug(player.pos, player.lastpos)
                        this.debug.debug(player.lastpos, l0)
                        this.debug.debug(l0, l1)
                    }
                    if(this.point_in_poly(l1, r0, r1, player.pos, player.lastpos, l0, l1, food.pos))
                        this.eat_food(player, food)
                }
            }
        }
    }

    mod(n, m){
        return ((n%m)+m)%m
    }

    point_in_poly(){
        const test = arguments[arguments.length-1]
        const nvert = arguments.length-1
        let c = false
        for(let i=0;i<nvert;i++){
            const j = this.mod(i-1,nvert)
            const beg = arguments[i]
            const end = arguments[j]
            const bigger = (end[0]-beg[0]) * (test[1]-beg[1]) / (end[1]-beg[1]) + beg[0]
            if( ((beg[1]>test[1]) != (end[1]>test[1])) && (test[0] < bigger)){
                c = !c
            }
        }
        return c
    }

    eat_food(player, food){
        player.size = Math.min(100,player.size+food.size/10.0)
        this.statemanager.delete_entity(food.id)
        const index = this.foods.indexOf(food)
        if(index!=-1) this.foods.splice(index,1)
    }

    physic_statisfy_constraints(){
        const diff = vec2.fromValues(0.0,0.0)
        const translate = vec2.fromValues(0.0,0.0)
        for(const player of this.players){
            const linkdist = player.hook_length
            if(player.hook_length == 0){
                //vec2.copy(player.hook_pos, player.pos)
                continue
            }
            vec2.sub(diff, player.pos, player.hook_pos)
            const d = vec2.length(diff)
            const difference = 0.4*(linkdist-d)/d
            vec2.scale(translate, diff, difference)
            vec2.add(player.pos, player.pos, translate)
        }
    }

    physic_verlet_integration(){
        const velocity = vec2.fromValues(0.0,0.0)
        const nextpos = vec2.fromValues(0.0,0.0)
        for(const player of this.players){
            vec2.sub(velocity, player.pos, player.lastpos)
            vec2.add(nextpos, player.pos, velocity)
            vec2.scaleAndAdd(nextpos, nextpos, GRAVITY, 1.0)
            vec2.copy(player.lastpos, player.pos)
            vec2.copy(player.pos, nextpos)
        }
    }

    physic_world_collision(){
        for(const player of this.players){
            this.level.collide(player, player.size)
        }
    }

    physic_serialize(){
        for(const player of this.players){
            player.x = player.pos[0]
            player.y = player.pos[1]
            player.hookx = player.hook_pos[0]
            player.hooky = player.hook_pos[1]
        }
    }

}

module.exports = GameLogic
