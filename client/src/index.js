import WebRTC from './webrtc'
import Config from './config'
import Input from './input'

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

let render = (state) => {
    let index = 0
    for(div of divs){
        let divpos = state.get(index)
        div.style.left = divpos[0] + 'px'
        div.style.top = divpos[1] + 'px'
        index++
    }
}

let webrtc = new WebRTC(Config.server,
    () => {
        console.log('WEBRTC connected')
        setInterval(
            () => {
                div2.innerHTML = 'local: ' + pos.toString()
                webrtc.send(pos)
            },
            Config.tickrate)
    },
    (data) => {
        for(let i=0; i<data.length; i+=4){
            let index = Math.floor(i/4)
            // console.log('index ' + index)
            if(!state.has(index)){
                console.log('new player')
                newdiv()
                state.set(index, [0,0])
            }
            let pos = state.get(index)
            pos[0] = data.readInt16LE(i+0)
            pos[1] = data.readInt16LE(i+2)
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
