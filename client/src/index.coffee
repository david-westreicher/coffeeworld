WebRTC = require('./webrtc.coffee')
Config = require('./config.coffee')
Input = require('./input.coffee')

div = document.createElement "div"
document.body.appendChild div
div2 = document.createElement "div"
document.body.appendChild div2

input = new Input
pos = [200,200]
state = {}
divs = []
newdiv = () ->
    div = document.createElement "div"
    div.style.position = 'absolute'
    div.style.width = '10px'
    div.style.height = '10px'
    div.style.background = '#00ff00'
    document.body.appendChild div
    divs.push div

render = (state) ->
    index = 0
    for div in divs
        divpos = state[index]
        div.style.left = divpos[0] + 'px'
        div.style.top = divpos[1] + 'px'
        index++

webrtc = new WebRTC Config.server,
    () ->
        console.log('WEBRTC connected')
        setInterval (() ->
            div2.innerHTML = 'local: ' + pos.toString()
            webrtc.send(pos)), Config.tickrate
    (data)->
        newindices = []
        for i in [0...data.length] by 4
            index = Math.floor(i/4)
            # console.log('index ' + index)
            if not (index of state)
                console.log('new player')
                newdiv()
                state[index] = [0,0]
            state[index][0] = data.readInt16LE(i+0)
            state[index][1] = data.readInt16LE(i+2)
            newindices.push index
        console.log 'newindices', newindices.toString()
        for id of state
            if (id in newindices)
                console.log 'deleting', id
                delete state[id]
        # console.log('received data')
        # console.log(data)
        # console.log('new state')
        # console.log(state)

update = (pos) ->
    dir = [0,0]
    if input.isdown 37 # left
        dir[0] = -1
    if input.isdown 38 # up
        dir[1] = -1
    if input.isdown 39 # right
        dir[0] = 1
    if input.isdown 40 # down
        dir[1] = 1
    pos[0] += dir[0]
    pos[1] += dir[1]

# render loop
do f = ->
    main = () ->
        window.requestAnimationFrame main
        update pos
        render state
    main()
    
webrtc.connect()
