const Random = require('random-seed')
const vec2 = require('gl-matrix').vec2
const normal_from_points = require('./util').normal_from_points

const MAPS = {
    minimal: {
        bounds: 200,
        balls: 0,
        rects: 0,
    },
    small: {
        bounds: 1200,
        balls: 10,
        rects: 10,
    },
    big: {
        bounds: 3000,
        balls: 30,
        rects: 30,
    },
    colltest: {
        bounds: 2500,
        balls: 0,
        rects: 0,
    },
}
const CURR_MAP = MAPS.big

class Line{
    constructor(start, end, isreal = true){
        this.start = start
        this.end = end
        this.mid = vec2.lerp(vec2.create(),start,end,0.5)
        this.length = vec2.distance(start,end)
        this.normal = normal_from_points(start,end)
        if(isreal)
            this.inner = new Line(vec2.copy(vec2.create(),this.mid), vec2.scaleAndAdd(vec2.create(),this.mid,this.normal,10),false)
    }
}

class Level{
    constructor(debug){
        // const seeded_rand = new Random(new Date().getMinutes())
        const seeded_rand = new Random(123435243)
        const bounds = CURR_MAP.bounds
        this.size = bounds
        this.lines = []
        this.createBoundary(seeded_rand, bounds)
        //this.lines.push(new Line([205,-150], [-195,-50]))
        //this.lines.push(new Line([205,-50], [-195,-150]))
        for(let i =0;i<CURR_MAP.balls;i++){
            const x = seeded_rand.floatBetween(-bounds,bounds)
            const y = seeded_rand.floatBetween(-bounds,bounds)
            const size = seeded_rand.floatBetween(100,200)
            this.addBall(x,y,size)
        }
        for(let i =0;i<CURR_MAP.rects;i++){
            const x = seeded_rand.floatBetween(-bounds,bounds)
            const y = seeded_rand.floatBetween(-bounds,bounds)
            const width = seeded_rand.floatBetween(100,200)
            const height = seeded_rand.floatBetween(100,200)
            this.addRectangle(x-width/2,y+height/2,x+width/2,y-height/2)
        }
        this.debug = debug
    }

    createBoundary(seeded_rand, bounds){
        this.addRectangle(bounds, bounds, -bounds,-bounds)
        for(const side of [
                [[-1,-1],[-1,1]], //left
                [[1,1],[1,-1]], //right
                [[1,-1],[-1,-1]], //top
                [[-1,1],[1,1]], //bottom
        ]){
            const normal = normal_from_points(side[0], side[1])
            let lastpos = null
            for(let alpha=0;alpha<=1;alpha+=0.1){
                const pos = vec2.lerp(vec2.create(), side[0], side[1], alpha)
                vec2.scale(pos,pos,bounds)
                vec2.scaleAndAdd(pos, pos, normal, -seeded_rand.floatBetween(0,bounds/5))
                if(lastpos){
                    this.lines.push(new Line(pos, lastpos))
                }
                lastpos = pos
            }
        }
    }

    addBall(x,y,size){
        let anglebefore = 0
        let iterations = 10
        for(let i=0;i<iterations;i++){
            const angle = (i+1)*Math.PI*2/iterations
            const start = vec2.fromValues(x+Math.sin(anglebefore)*size, y+Math.cos(anglebefore)*size)
            const end = vec2.fromValues(x+Math.sin(angle)*size, y+Math.cos(angle)*size)
            this.lines.push(new Line(start,end))
            anglebefore = angle
        }
    }
    addRectangle(left,bottom, right,top){
        this.lines.push(new Line(vec2.fromValues(right,top), vec2.fromValues(left,top)))
        this.lines.push(new Line(vec2.fromValues(left,top), vec2.fromValues(left,bottom)))
        this.lines.push(new Line(vec2.fromValues(left,bottom), vec2.fromValues(right,bottom)))
        this.lines.push(new Line(vec2.fromValues(right,bottom), vec2.fromValues(right,top)))
    }

    //TODO cleanup, explain
    /*
     a point is inside iff on correct normal side and distance to inner line is < line length/2
      
    _________________
     inner line      | < line                                      
       v             |
     ------------    +------>
                     |   ^
    _________________| normal
            ^
  boundary (inside/outside)

     */
    collide(entity,size){
        const u = vec2.create()
        const w = vec2.create()
        const newspeed = vec2.create()
        const vel = vec2.sub(vec2.create(),entity.pos,entity.lastpos)
        const diff = vec2.create()

        let closest_dist = 0
        const bestnormal = vec2.create()
        const bestpos = vec2.create()
        const collnormal = vec2.create()
        const collpos = vec2.create()

        for(let line of this.lines){
            //  Collide moving sphere with line with minkowski sum
            //                                         ___
            //                                        /   \
            //             *                         / _+_ \ < circle 1
            //             |                         |\_|_/|
            //       _     |      _                  |  |  |    
            //      (_)----+-----(_)    ---->    *---|--+--|---* < line
            //             |                         | _|_ | < rectangle
            //             |                         |/_|_\|
            //             *                         \  +  / < circle 2
            //                                        \___/
            //
            let hascollided = false

            //  if wrong direction -> no collision
            if(vec2.dot(vel,line.normal)>0)
                continue
            //  if not inside line radius -> no collision
            if(vec2.distance(entity.pos,line.mid) > line.length+size)
                continue

            //  Check if pos in minkowski sum:
            //      1. check if pos in rectangle -> push out normal
            const linedist = this.line_point_dist(line, entity.pos)
            if(linedist<size && this.line_point_dist(line.inner, entity.pos) < line.length/2){
                //          on which side of the line is pos
                vec2.sub(diff, entity.pos, line.start)
                if(vec2.dot(diff, line.normal)<0){
                    //      behind normal
                    vec2.scaleAndAdd(collpos, entity.pos, line.normal, size+linedist)
                }else{
                    //      in front of normal
                    vec2.scaleAndAdd(collpos, entity.pos, line.normal, size-linedist)
                }
                vec2.copy(collnormal, line.normal)
                if(this.debug)
                    this.debug.debug(collpos, vec2.scaleAndAdd(vec2.create(),collpos, line.normal, -size))
                hascollided = true
            }
            if(!hascollided){
            //      2. check if pos in any circles -> push out circle normal
                for(const circle_pos of [line.start, line.end]){
                    const circle_dist = vec2.distance(entity.pos, circle_pos)
                    if(circle_dist<size){
                        vec2.sub(diff, entity.pos, circle_pos)
                        vec2.normalize(diff,diff)
                        vec2.copy(collnormal, diff)
                        vec2.scaleAndAdd(collpos, entity.pos, diff, size-circle_dist)
                        if(this.debug)
                            this.debug.debug(circle_pos, collpos)
                        hascollided = true
                        break
                    }
                }
            }
            if(hascollided){
                // find the closest collision
                const coll_dist = vec2.distance(collpos, entity.pos)
                if(coll_dist>closest_dist){
                    closest_dist = coll_dist
                    vec2.copy(bestnormal, collnormal)
                    vec2.copy(bestpos, collpos)
                }
            }else{
            // TODO
            //  Check for line intersection:
            //      1. check if line intersects rectangle
            //      2. check if line interects circle
            //      3. set pos to closest intersection point
            }

        }
        if(closest_dist>0){
            // calculate new speed with friction/bounciness
            vec2.scale(u,bestnormal,vec2.dot(bestnormal,vel))
            vec2.sub(w,vel,u)
            vec2.scale(w,w,1.0)
            vec2.scale(u,u,1.0)
            vec2.sub(newspeed,w,u)

            vec2.copy(entity.pos, bestpos)
            vec2.sub(entity.lastpos, entity.pos, newspeed)
            /*
            if(this.debug){
                this.debug.debug(entity.pos, entity.lastpos)
                this.debug.debug(bestline.start, bestline.end)
            }
            */
        }
    }

    line_point_dist(line,corner){
        const top = Math.abs(
                (line.end[1]-line.start[1])*corner[0]-
                (line.end[0]-line.start[0])*corner[1]+
                line.end[0]*line.start[1]-
                line.end[1]*line.start[0])
        const bot = line.length
        return top/bot
    }

    raycast(start, dir){
        const closestintersection = vec2.fromValues(100000,100000)
        const intersection = vec2.fromValues(0.0,0.0)
        for(let line of this.lines){
            const collided = this.get_line_intersection(
                    start[0], start[1],
                    start[0] + dir[0], start[1] + dir[1],
                    line.start[0], line.start[1], line.end[0], line.end[1],
                    intersection)
            if(collided){
                if(vec2.distance(start,closestintersection) > vec2.distance(start,intersection)){
                    vec2.copy(closestintersection,intersection)
                }
            }
        }
        return closestintersection 
    }

    segment_segment_intersect(start0, end0, start1, end1){
        let s1_x = end0[0] - start0[0]
        let s1_y = end0[1] - start0[1]
        let s2_x = end1[0] - start1[0]
        let s2_y = end1[1] - start1[1]

        let s, t
        s = (-s1_y * (start0[0] - start1[0]) + s1_x * (start0[1] - start1[1])) / (-s2_x * s1_y + s1_x * s2_y)
        t = ( s2_x * (start0[1] - start1[1]) - s2_y * (start0[0] - start1[0])) / (-s2_x * s1_y + s1_x * s2_y)

        if (s >= 0 && s <= 1 && t >= 0 && t <= 1)
        {
            // Collision detected
            return true
        }
        return false
    }

    get_line_intersection(p0_x, p0_y, p1_x, p1_y, 
        p2_x, p2_y, p3_x, p3_y, intersection)
    {
        let s1_x = p1_x - p0_x
        let s1_y = p1_y - p0_y
        let s2_x = p3_x - p2_x
        let s2_y = p3_y - p2_y

        let s, t
        s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y)
        t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y)

        if (s >= 0 && s <= 1 && t >= 0)
        {
            // Collision detected
            intersection[0] =  p0_x + (t * s1_x)
            intersection[1] =  p0_y + (t * s1_y)
            return true
        }
        return false
    }

}

module.exports = Level
