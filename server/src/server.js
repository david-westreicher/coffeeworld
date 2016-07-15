'use strict'

const PORT = 9000

const Peer = require('simple-peer')
const wrtc = require('wrtc')
const WebSocketServer = require('ws').Server

const GameServer = require('./gameserver')
const GameLogic = require('./game/server')
const Config = require('./game/config')
const gameserver = new GameServer(Config,new GameLogic())

const wss = new WebSocketServer({ port: PORT })
console.log('Starting websocketserver on port: ' + PORT)

let glob_id = 0
wss.on('connection', (ws) => {
    const id = glob_id++
    const peer = new Peer({
        initiator: true,
        wrtc: wrtc,
        config: {
            'iceServers': [ {url: 'stun:stun1.l.google.com:19305'} ]
        },
        channelConfig: {
            ordered: false,
            maxRetransmits: 0
        },
        trickle: false,
        offerConstraints:{}
    })
    peer.on('signal', (data) => {
        const json = JSON.stringify(data)
        console.log('PEER '+id+' signal: '+json)
        ws.send(json)
    })
    peer.on('connect', () => {
        gameserver.newpeer(peer)
        console.log('PEER '+id+' connected')
    })
    peer.on('data', (data) => {
        gameserver.newdata(data, peer)
    })
    peer.on('error', (err) => {
        console.log('PEER '+id+' onerror: '+err)
        console.log(err)
        gameserver.deletepeer(peer)
    })
    peer.on('close', () => {
        console.log('PEER '+id+' onclose')
        gameserver.deletepeer(peer)
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

