var Peer = require('simple-peer');
var wrtc = require('wrtc');
var WebSocketServer = require('ws').Server;
var PORT = 9000;
var TICKRATE = 16;

var wss = new WebSocketServer({ port: PORT });
console.log('Starting websocketserver on port: ' + PORT);

var channelConfig = {
    ordererd: false,
    maxRetransmits: 0
}

var peers = {}
var state = {}
var toremove = []

var time = 0;
var messagebuf = new Int16Array(10*2); // 10 players
var broadcaster = setInterval(function(){
    //console.log(peers);
    //console.log(Object.keys(peers).length);
    //TODO peers access should be secured with mutex
    //console.log(state);
    for(var toremoveid in toremove){
        delete peers[toremoveid];
        delete state[toremoveid];
        console.log('removing id: '+ toremoveid);
        console.log('resulting state: ');
        console.log(state);
        console.log(Object.keys(state));
    }
    var players = Object.keys(state).length;
    var index = 0;
    Object.keys(state).forEach(function(id){
        messagebuf[index*2+0] = state[id][0];
        messagebuf[index*2+1] = state[id][1];
        index++;
    });
    for(var c in Object.keys(peers)){
        var peer = peers[c];
        if(peer && peer.connected)
            //TODO use reusable buffer
            peer.send(messagebuf.slice(0,players*2));
    }
    time++;
}, TICKRATE);

wss.on('connection', function connection(ws) {
    //TODO generate random id
    var id = Object.keys(peers).length;
    var peer = new Peer({ initiator: true, wrtc: wrtc, channelConfig:channelConfig, offerConstraints:{}})
    peer.on('signal', function (data) {
        console.log('PEER '+id+' signal: '+data)
        ws.send(JSON.stringify(data));
    })
    var interval = null;
    peer.on('connect', function(){
        console.log('PEER '+id+' connected');
        peers[id] = peer;
        state[id] = [0,0];
    });
    peer.on('data', function(data){
        if(typeof state[id] != 'undefined'){
            state[id][0] = data.readInt16LE(0);
            state[id][1] = data.readInt16LE(2);
        }else{
            console.log('ondataexit')
            console.log(data)
        }
    });
    peer.on('error', function(err){
        console.log('PEER '+id+' onerror: '+err);
        console.log(err);
        toremove.push(id);
    });
    peer.on('close', function(){
        console.log('PEER '+id+' onclose');
        toremove.push(id);
    });
    ws.on('message', function(message) {
        console.log('WEBSOCKET '+id+' onmessage: '+message);
        var data = JSON.parse(message);
        peer.signal(data);
    });
    ws.on('close', function close() {
        console.log('WEBSOCKET '+id+' disconnected');
    });
});

