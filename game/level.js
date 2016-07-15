const Random = require('random-seed')
const vec2 = require('gl-matrix').vec2

const MAPS = {
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
}
const CURR_MAP = MAPS.small

const normal_from_points = (start, end)=>{
    const normal = vec2.sub(vec2.create(), start, end)
    vec2.set(normal, -normal[1], normal[0])
    vec2.normalize(normal,normal)
    return normal
}

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
        this.lines = []
        this.createBoundary(seeded_rand, bounds)
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
                vec2.scaleAndAdd(pos, pos, normal, seeded_rand.floatBetween(0,bounds/5))
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
        const corners = [[-1,-1],[1,1],[-1,1],[1,-1]]
        const cpos = vec2.create()
        const diff = vec2.create()
        const u = vec2.create()
        const w = vec2.create()
        const newspeed = vec2.create()
        const vel = vec2.sub(vec2.create(),entity.pos,entity.lastpos)
        const veldir = vec2.normalize(vec2.create(),vel)
        let bestdot = -1
        let bestnorm = null
        let bestdepth = 0
        for(let line of this.lines){
            let maxprenetation = -1
            for(let corner of corners){
                vec2.scaleAndAdd(cpos,entity.pos,corner,size)
                vec2.sub(diff, line.start, cpos)
                vec2.normalize(diff,diff)
                const dot = vec2.dot(line.normal, diff)
                if(dot>0)
                    continue
                    //const innerline = []
                const innerdist = this.line_point_dist(line.inner,cpos)
                if(innerdist>line.length/2)
                    continue
                const dist = this.line_point_dist(line,cpos)
                if(dist<20){
                    if(dist>maxprenetation){
                        maxprenetation = dist
                    }
                }
            }
            if(maxprenetation>0){
                const dot = vec2.dot(line.normal, veldir)
                if(dot>0 && dot>bestdot){
                    bestdot = dot
                    bestnorm = line.normal
                    bestdepth = maxprenetation
                }
            }
        }
        if(bestnorm){
            // calculate new speed with friction/bounciness
            vec2.scale(u,bestnorm,vec2.dot(bestnorm,vel))
            vec2.sub(w,vel,u)
            vec2.scale(w,w,1.0)
            vec2.scale(u,u,1.0)
            vec2.sub(newspeed,w,u)

            vec2.scaleAndAdd(entity.pos, entity.pos, bestnorm, -bestdepth)
            vec2.sub(entity.lastpos, entity.pos, newspeed)
            if(this.debug)
                this.debug.debug(entity.pos[0], entity.pos[1], entity.lastpos[0], entity.lastpos[1])
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
