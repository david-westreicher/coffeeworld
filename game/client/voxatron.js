import rand from 'random-seed'

const RENDER_SIZE = 300
const VOXEL_SIZE = 60
class Renderer{
    constructor(){
        this.canvas = document.createElement('canvas')
        this.canvas.width = RENDER_SIZE
        this.canvas.height = RENDER_SIZE
        this.ctx = this.canvas.getContext('2d')
        this.imgdata = this.ctx.getImageData(0,0,RENDER_SIZE,RENDER_SIZE)
        document.body.appendChild(this.canvas)

        const buf = new ArrayBuffer(RENDER_SIZE*RENDER_SIZE*4)
        this.buf8 = new Uint8ClampedArray(buf)
        this.buf32 = new Uint32Array(buf)

        this.infobox = document.createElement('div')
        document.body.appendChild(this.infobox)
        window.addEventListener('resize', this.onWindowResize.bind(this), false)
        this.onWindowResize()

        this.level = new Uint32Array(VOXEL_SIZE*VOXEL_SIZE*VOXEL_SIZE)
        this.pixels_affected = []
        for(let x=0;x<VOXEL_SIZE;x++){
            for(let y=0;y<VOXEL_SIZE;y++){
                for(let z=0;z<VOXEL_SIZE;z++){
                    /*if(
                            (x%(VOXEL_SIZE-1))==0 ||
                            (y%(VOXEL_SIZE-1))==0 ||
                            (z%(VOXEL_SIZE-1))==0){
                        this.level[this.pixels_affected.length] = 0
                    }else{
                        this.level[this.pixels_affected.length] = 0xFF000000 + (x<<0) + (y<<8) //Math.floor(Math.random()*2)
                    }
                    */
                    //this.level[this.pixels_affected.length] = Math.floor(Math.random()*0xFFFFFFFF)
                    let col = (255 << 24) | (x << 16) | (y << 8) | z
                    col = (255 << 24) | (z*20)
                    this.level[this.pixels_affected.length] = col
                    let height = Math.sin(x) * Math.sin(y)
                    if(((height+1)*VOXEL_SIZE/2)>z){
                        this.level[this.pixels_affected.length] = 0
                    }
                    //console.log(this.level[this.pixels_affected.length].toString(16))
                    const pixs = []
                    pixs.push(this.pixel_from_coord(x,y))
                    this.pixels_affected.push(pixs)
                }
            }
        }
    }

    pixel_from_coord(x,y){
        return x*RENDER_SIZE+y
    }

    onWindowResize(){
        this.midx = window.innerWidth/2
        this.midy = window.innerHeight/2
    }

    new_player_div(){
        let div = document.createElement('div')
        div.style.position = 'absolute'
        div.style.width = '10px'
        div.style.height = '10px'
        div.style.background = '#00ff00'
        document.body.appendChild(div)
        this.player_divs.push(div)
    }

    new_bullet_div(){
        let div = document.createElement('div')
        div.style.position = 'absolute'
        div.style.width = '2px'
        div.style.height = '2px'
        div.style.background = '#000000'
        document.body.appendChild(div)
        this.bullet_divs.push(div)
    }

    render(players, id, bullets, stats){
        this.infobox.innerHTML = ', entity_id: ' + id +
            ', ping:' + stats.ping.toFixed(2) +
            ', sending kbps:' + (stats.bytes_sent()*8.0/1000.0) +
            ', receiving kbps:' + (stats.bytes_received()*8.0/1000.0) +
            ', entities: (players:' +players.size+'), (bullets:'+bullets.size+')'
        this.infobox.style.background = '#000000'
        this.infobox.style.color = '#FFFFFF'

        this.buf32.fill(0)
        const pixs_affected = this.pixels_affected
        const buf32 = this.buf32
        const level = this.level
        const left = -1
        const right = +1
        const down = -VOXEL_SIZE
        const up = VOXEL_SIZE
        const back = -VOXEL_SIZE*VOXEL_SIZE
        const front = VOXEL_SIZE*VOXEL_SIZE
        const sides = [left, right, down, up, back, front]
        let index = -1 //right + up + front - 1
        for(let x=0;x<VOXEL_SIZE;x++){
            for(let y=0;y<VOXEL_SIZE;y++){
                for(let z=0;z<VOXEL_SIZE;z++){
                    index++
                    const col = level[index]
                    if(!col)
                        continue
                    /*
                    let surrounded = true
                    for(let s=0;s<sides.length;s++){
                        if(!this.level[index + sides[s]]){
                            surrounded = false
                            break
                        }
                    }
                    if(surrounded)
                        continue
                    */
                    const pixs = pixs_affected[index]
                    for(let p =0;p<pixs.length;p++){
                        buf32[pixs[p]] = col //Math.floor(Math.random()*0xFFFFFFFF)//col //0xFFFF0000//
                    }
                }
            }
        }

        this.imgdata.data.set(this.buf8)
        this.ctx.putImageData(this.imgdata,0,0)
    }
}


export default Renderer
