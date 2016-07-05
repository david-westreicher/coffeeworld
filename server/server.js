'use strict'

const PORT = 9000
const TICKRATE = 50
const Peer = require('simple-peer')
const wrtc = require('wrtc')
const WebSocketServer = require('ws').Server

const wss = new WebSocketServer({ port: PORT })
console.log('Starting websocketserver on port: ' + PORT)


const peers = {}
const state = {}
const toremove = []

const messagebuf = new Int16Array(10*2) // 10 players
setInterval(() => {
    //console.log(peers)
    //console.log(Object.keys(peers).length)
    //TODO peers access should be secured with mutex
    //console.log(state)
    for(const toremoveid in toremove){
        delete peers[toremoveid]
        delete state[toremoveid]
        console.log('removing id: '+ toremoveid)
        console.log('resulting state: ')
        console.log(state)
        console.log(Object.keys(state))
    }
    const players = Object.keys(state).length
    let index = 0
    Object.keys(state).forEach(function(id){
        messagebuf[index*2+0] = state[id][0]
        messagebuf[index*2+1] = state[id][1]
        index++
    })
    for(const c in Object.keys(peers)){
        const peer = peers[c]
        if(peer && peer.connected)
            //TODO use reusable buffer
            peer.send(messagebuf.slice(0,players*2))
    }
}, TICKRATE)


const channelConfig = {
    ordererd: false,
    maxRetransmits: 0
}
wss.on('connection', (ws) => {
    //TODO generate random id
    const id = Object.keys(peers).length
    const peer = new Peer({
        initiator: true,
        wrtc: wrtc,
        channelConfig:channelConfig,
        offerConstraints:{}
    })
    peer.on('signal', (data) => {
        console.log('PEER '+id+' signal: '+data)
        ws.send(JSON.stringify(data))
    })
    peer.on('connect', () => {
        console.log('PEER '+id+' connected')
        peers[id] = peer
        state[id] = [0,0]
    })
    peer.on('data', (data) => {
        if(typeof state[id] != 'undefined'){
            state[id][0] = data.readInt16LE(0)
            state[id][1] = data.readInt16LE(2)
        }else{
            console.log('ondataexit')
            console.log(data)
        }
    })
    peer.on('error', (err) => {
        console.log('PEER '+id+' onerror: '+err)
        console.log(err)
        toremove.push(id)
    })
    peer.on('close', () => {
        console.log('PEER '+id+' onclose')
        toremove.push(id)
    })
    ws.on('message', (message) => {
        console.log('WEBSOCKET '+id+' onmessage: '+message)
        const data = JSON.parse(message)
        peer.signal(data)
    })
    ws.on('close', () => {
        console.log('WEBSOCKET '+id+' disconnected')
    })
})

