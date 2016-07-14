const NetworkStats= require('./networkstats')
const MessagePlayerid = require('./netmessages').MessagePlayerid
const MessagePing = require('./netmessages').MessagePing
const MessageCmd = require('./netmessages').MessageCmd
const MessageState = require('./netmessages').MessageState

const IS_DEDICATED = true
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

class Networklayer{
    static createServer(create_cmd, create_entitity_funcs){
        const network = new Networklayer(create_entitity_funcs, create_cmd())
        network.cmds = []
        network.cmdspointer = 0
        network.new_cmd = create_cmd
        return network
    }
    static createClient(statemanager, command, create_entitity_funcs){
        const network = new Networklayer(create_entitity_funcs, command)
        network.playerid = -1
        network.statemanager = statemanager
        network.ping = new Ping(5000)
        return network
    }

    constructor(create_entitity_funcs, command){
        this.stats = new NetworkStats()
        this.msg_playerid = new MessagePlayerid(MSG_ID)
        this.msg_cmd = new MessageCmd(MSG_CMD, command)
        this.msg_ping = new MessagePing(MSG_PING)
        this.msg_state = new MessageState(MSG_STATE, create_entitity_funcs)
    }

    connect(webrtc){
        this.webrtc = webrtc
        this.webrtc.ondata(this.on_client_data.bind(this))
        this.webrtc.connect()
    }

    send_cmd(cmd){
        // TODO is it better to use setinterval(send_ping, 1000)?
        if(this.ping.shouldsend()){
            this.msg_ping.encode()
            this.send_msg(this.msg_ping)
        }

        if(this.playerid==-1)
            return
        this.msg_cmd.encode(this.playerid, cmd)
        this.send_msg(this.msg_cmd)
    }

    on_client_data(data){
        data = new Buffer(data)
        this.stats.bytes_received(data.length)
        const msgtype = data.readUInt8(0)
        switch(msgtype){
        case MSG_ID:
            this.playerid = this.msg_playerid.decode(data)
            this.on_playerid(this.playerid)
            console.log('player id', this.playerid, data)
            break
        case MSG_STATE:{
            const state = this.msg_state.decode(data, this.statemanager.state)
            this.statemanager.state = state
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
        if(peer){
            if(IS_DEDICATED){
                peer.send(new Uint8Array(data))
                return
            }
            peer.send(data)
        }else{
            this.webrtc.send(data)
        }
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
            while(this.cmds.length <= this.cmdspointer){
                this.cmds.push(this.new_cmd())
            }
            const cmd = this.cmds[this.cmdspointer++]
            const playerid = this.msg_cmd.decode(data, cmd)
            cmd.playerid = playerid
            this.on_cmd(peer, cmd, playerid)
            break
        }
        default:
            throw msgtype + ' NotImplemented error, data:' + data
        }
    }

    get_cmds(){
        const cmds = this.cmds.slice(0,this.cmdspointer)
        this.cmdspointer = 0
        return cmds
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
