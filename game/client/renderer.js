import rand from 'random-seed'

class Renderer{
    constructor(){
        this.colors = new Map()
        this.createCanvas()
        this.createInfoBox()
        window.addEventListener('resize', this.onWindowResize.bind(this), false)
        this.onWindowResize()
        this.cam = [0,0,0.5]
    }

    createInfoBox(){
        this.infobox = document.createElement('div')
        this.infobox.style.overflow = 'visible'
        this.infobox.style.pointerEvents = 'none'
        this.infobox.style.background = 'none !important'
        this.infobox.style['-webkit-user-select'] = 'none'
        this.infobox.style['user-select'] = 'none'
        this.infobox.style['-moz-user-select'] = '-moz-none'
        this.infobox.style['-khtml-user-select'] = 'none'
        document.body.appendChild(this.infobox)
    }

    createCanvas(){
        const canvas = document.createElement('canvas')
        canvas.style.position = 'absolute'
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        canvas.style.pointerEvents = 'none'
        canvas.style.background = 'none !important'
        this.draw_ctx=canvas.getContext('2d')
        this.draw_ctx.rect(0,0,canvas.width,canvas.height)
        this.draw_ctx.stroke()
        document.body.appendChild(canvas)
        this.canvas = canvas
    }

    onWindowResize(){
        console.log('resize')
        this.midx = window.innerWidth/2
        this.midy = window.innerHeight/2
        this.canvas.style.top = (this.midy-this.canvas.height/2)+'px'
        this.canvas.style.left = (this.midx-this.canvas.width/2)+'px'
    }

    getcolor(id){
        let color = this.colors.get(id)
        if(!color){
            const tmprand = rand.create(id)
            for(let i=0;i<id;i++)
                tmprand(10)
            const letters = '0123456789ABCDEF'.split('')
            color = '#'
            for(let i=0;i<6;i++)
                color += letters[tmprand(16)]
            this.colors.set(id,color)
        }
        return color
    }

    updatecam(player){
        if(!player)
            return
        this.cam[0] += (player.x-this.cam[0])/4
        this.cam[1] += (player.y-this.cam[1])/4
    }

    render(level, players, id, bullets, stats, debugs){
        this.infobox.innerHTML = ', entity_id: ' + id +
            ', ping:' + stats.ping.toFixed(2) +
            ', sending kbps:' + (stats.bytes_sent()*8.0/1000.0) +
            ', receiving kbps:' + (stats.bytes_received()*8.0/1000.0) +
            ', entities: (players:' +players.size+'), (debugs:'+debugs.size+')'
        this.infobox.style.background = this.getcolor(id)
        this.infobox.style.color = '#FFFFFF'

        this.draw_ctx.setTransform(1,0,0,1,0,0)
        this.draw_ctx.clearRect(0, 0, this.canvas.width,this.canvas.height)
        this.updatecam(players.get(id))
        this.draw_ctx.setTransform(this.cam[2],0,0,this.cam[2],
            this.canvas.width/2-this.cam[0]*this.cam[2],
            this.canvas.height/2-this.cam[1]*this.cam[2])

        this.drawPlayers(this.draw_ctx, players)
        this.drawLevel(this.draw_ctx, level)
        this.drawDebug(this.draw_ctx, debugs)
    }

    drawPlayers(ctx, players){
        for(const [id, player] of players){
            const col = this.getcolor(id)
            // player
            ctx.fillStyle= col
            ctx.beginPath()
            ctx.arc(player.x, player.y, 10, 0, 2*Math.PI)
            ctx.fill()
            // hook
            ctx.beginPath()
            ctx.arc(player.hookx, player.hooky, 5, 0, 2*Math.PI)
            ctx.moveTo(player.hookx, player.hooky)
            ctx.lineTo(player.x , player.y)
            ctx.stroke()
        }
    }

    drawLevel(ctx, level){
        ctx.strokeStyle= '#000000'
        ctx.beginPath()
        for(let line of level.lines){
            ctx.moveTo(line.start[0], line.start[1])
            ctx.lineTo(line.end[0], line.end[1])
            ctx.moveTo(line.mid[0], line.mid[1])
            ctx.lineTo(line.mid[0]+line.normal[0]*10, line.mid[1]+line.normal[1]*10)
        }
        ctx.stroke()
    }

    drawDebug(ctx, debugs){
        ctx.strokeStyle= '#FF0000'
        ctx.beginPath()
        for(const debug of debugs.values()){
            ctx.moveTo(debug.x0, debug.y0)
            ctx.lineTo(debug.x1, debug.y1)
        }
        ctx.stroke()
    }
}


export default Renderer
