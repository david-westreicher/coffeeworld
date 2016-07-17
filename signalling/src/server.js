'use strict'
const WebSocketServer = require('ws').Server

const PORT = 9000
const wss = new WebSocketServer({ port: PORT })
console.log('Starting signalling server on port: ' + PORT)

let glob_id = 0
let servers = []
const id_ws_map = new Map()

// id:
//  {
//      type: 'id',
//      id: 12312,
//  }
//
// server list
//  {
//      type: 'server_list',
//      servers: [
//          {
//              id: 123,
//              name: 'bla'
//          },
//      ]
//  }
//
// server:
//  {
//      type: 'server',
//      name: 'bla',
//  }
//
// signal:
//  {
//      type: 'signal',
//      to_id: 'serverid',
//      from_id: 'clientid',
//      data: sdp,
//  }

wss.on('connection', (ws) => {
    const id = glob_id++
    id_ws_map.set(id, ws)

    ws.send(JSON.stringify({
        type: 'id',
        id: id,
    }))

    console.log('connection to ' + id + ' started')
    const send_servers = ()=>{
        ws.send(JSON.stringify({
            type: 'server_list',
            servers: servers,
        }))
    }
    const send_servers_task = setInterval(send_servers, 1000*5)
    ws.on('message', (message) => {
        console.log(typeof message)
        const data = JSON.parse(message)
        console.log('[WEBSOCKET]  ' + id + ' onmessage: ' + message)
        switch(data.type){
        case 'server':
            servers.push({
                id: id,
                name: data.name,
            })
            clearInterval(send_servers_task)
            break
        case 'signal':{
            data.from_id = id
            const websocket = id_ws_map.get(data.to_id)
            if(!websocket)
                break
            websocket.send(JSON.stringify({
                type: 'signal',
                to_id: data.to_id,
                from_id: id,
                data: data.data,
            }))
            break
        }
        }
    })
    ws.on('close', () => {
        console.log('[WEBSOCKET]  '+id+' disconnected')
        clearInterval(send_servers_task)
        id_ws_map.delete(id)
        servers = servers.filter((server)=>{
            return server.id!=id
        })
    })
})

