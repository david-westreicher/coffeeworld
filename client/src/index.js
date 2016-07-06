import WebRTC from './webrtc'
import Config from './config'
import Input from './input'
import rand from 'random-seed'

let div = document.createElement('div')
document.body.appendChild(div)
let div2 = document.createElement('div')
document.body.appendChild(div2)

let input = new Input()
let pos = [200,200]
let state = new Map()
let divs = []
let newdiv = () => {
    let div = document.createElement('div')
    div.style.position = 'absolute'
    div.style.width = '10px'
    div.style.height = '10px'
    div.style.background = '#00ff00'
    document.body.appendChild(div)
    divs.push(div)
}

const colors = new Map()
let getcolor = (id) => {
    let color = colors.get(id)
    if(!color){
        const tmprand = rand.create(id)
        for(let i=0;i<id;i++)
            tmprand(10)
        const letters = '0123456789ABCDEF'.split('')
        color = '#'
        for(let i=0;i<6;i++)
            color += letters[tmprand(16)]
        colors.set(id,color)
    }
    return color
}

let render = (state) => {
    let divi = 0
    for(const [id, pos] of state){
        const div = divs[divi]
        div.style.background = getcolor(id)
        div.style.left = pos[0] + 'px'
        div.style.top = pos[1] + 'px'
        divi++
    }
}

let id = -1
let webrtc = new WebRTC(Config.server,
    () => {
        console.log('WEBRTC connected')
        setInterval(
            () => {
                div2.innerHTML = 'local: ' + pos.toString() + ', id: ' + id
                if(id>=0){
                    div2.style.background = getcolor(id)
                    webrtc.send(id, pos)
                }
            },
            Config.tickrate)
    },
    (data) => {
        if(id==-1){
            id = data.readInt32LE(0)
            console.log('id: ', id)
            return
        }
        const intsperplayer = 3 // id: 1, pos: 2
        const bytes_per_int = 2
        const players = (data.length/intsperplayer)/bytes_per_int
        state = new Map()
        for(let i=0; i<players; i++){
            const offset = i*intsperplayer*bytes_per_int
            const pos = [0,0]
            const id = data.readInt16LE(offset+0*bytes_per_int)
            pos[0] = data.readInt16LE(offset+1*bytes_per_int)
            pos[1] = data.readInt16LE(offset+2*bytes_per_int)
            state.set(id, pos)
        }
        while(divs.length < state.size){
            newdiv()
        }
        while(divs.length > state.size){
            const div = divs.pop()
            div.parentNode.removeChild(div)
        }
        render(state)
    }
)


let update = (pos) => {
    let dir = [0,0]
    if(input.isdown(37)) // left
        dir[0] = -1
    if(input.isdown(38)) // up
        dir[1] = -1
    if(input.isdown(39)) // right
        dir[0] = 1
    if(input.isdown(40)) // down
        dir[1] = 1
    pos[0] += dir[0]
    pos[1] += dir[1]
}

// render loop
let start = () =>{
    let main = () => {
        window.requestAnimationFrame(main)
        update(pos)
        render(state)
    }
    main()
}
start()
    
webrtc.connect()
