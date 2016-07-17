const NetworkStats= require('./networkstats')
const MessagePlayerid = require('./netmessages').MessagePlayerid
const MessagePing = require('./netmessages').MessagePing
const MessageCmd = require('./netmessages').MessageCmd
const MessageState = require('./netmessages').MessageState
const EventEmitter = require('events')

const MSG_ID    = 0
const MSG_STATE = 1
const MSG_PING  = 2
const MSG_CMD   = 3

class Ping{
    constructor(ms){
        this.last_time_sent = 0
        this.every_ms = ms
    }

    shouldsend(){
        const now = Date.now()
        if((now-this.last_time_sent) > this.every_ms){
            // console.log('sending ping')
            this.last_time_sent = now
            return true
        }
        return false
    }
}

class Networklayer extends EventEmitter{
    static createServer(config){
        return new Networklayer(config) 
    }

    static createClient(config){
        const network = new Networklayer(config)
        network.ping = new Ping(2000)
        return network
    }

    constructor(config){
        super()
        this.config = config
        this.stats = new NetworkStats()
        this.msg_playerid = new MessagePlayerid(MSG_ID)
        this.msg_cmd = new MessageCmd(MSG_CMD, config.get_command())
        this.msg_ping = new MessagePing(MSG_PING)
        this.msg_state = new MessageState(MSG_STATE, config.get_entities)
    }

    connect(isclient, peer){
        if(isclient){
            peer.on('data',this.on_client_data.bind(this))
            this.server_peer = peer
        }else{
            peer.on('data',(data)=>{
                this.on_server_data(data, peer)
            })
        }
    }

    send_cmd(cmd, playerid){
        if(!this.server_peer) // we need a connection to the server
            return

        // TODO is it better to use setinterval(send_ping, 1000)?
        if(this.ping.shouldsend()){
            this.msg_ping.encode()
            this.send_msg(this.msg_ping, this.server_peer)
        }

        if(!playerid) // we need a playerid from the server first
            return
        this.msg_cmd.encode(playerid, cmd)
        this.send_msg(this.msg_cmd, this.server_peer)
    }

    on_client_data(data){
        data = new Buffer(data)
        this.stats.bytes_received(data.length)
        const msgtype = data.readUInt8(0)
        switch(msgtype){
        case MSG_ID:{
            const player_id = this.msg_playerid.decode(data)
            this.emit('player_id', player_id)
            break
        }
        case MSG_STATE:{
            const state = this.msg_state.decode(data)
            this.emit('state', state)
            break
        }
        case MSG_PING:{
            const sent_time = this.msg_ping.decode(data)
            const now = window.performance.now()
            this.stats.ping = now - sent_time
            break
        }
        default:
            throw 'NotImplemented error'
        }
    }

    send_msg(msg, peer){
        let data = msg.buf
        peer.send(data)
        this.stats.bytes_sent(data.length)
    }

    on_server_data(data, peer){
        data = Buffer.from(data)
        this.stats.bytes_received(data.length)
        const msgtype = data.readUInt8(0)
        switch(msgtype){
        case MSG_PING:
            this.msg_ping.encode(this.msg_ping.decode(data))
            this.send_msg(this.msg_ping, peer)
            break
        case MSG_CMD:{
            const cmd = this.config.get_command()
            const playerid = this.msg_cmd.decode(data, cmd)
            cmd.playerid = playerid
            this.emit('command', cmd)
            break
        }
        default:
            throw msgtype + ' NotImplemented error, data:' + data
        }
    }

    send_state(state, peer){
        this.msg_state.encode(state)
        this.send_msg(this.msg_state, peer)
    }

    send_playerid(id, peer){
        this.msg_playerid.encode(id)
        this.send_msg(this.msg_playerid, peer)
    }
}

module.exports = Networklayer
