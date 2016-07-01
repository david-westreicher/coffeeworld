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

var time = 0;
var messagebuf = new Int16Array(10*2); // 10 players
var broadcaster = setInterval(function(){
    //console.log(peers);
    //console.log(Object.keys(peers).length);
    //TODO peers access should be secured with mutex
    //console.log(state);
    var players = Object.keys(state).length;
    var index = 0;
    for(var id in Object.keys(state)){
        messagebuf[index*2+0] = state[id][0];
        messagebuf[index*2+1] = state[id][1];
        index++;
    }
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
    //TODO peers access should be secured with mutex
    var id = Object.keys(peers).length;
    var peer = new Peer({ initiator: true, wrtc: wrtc, channelConfig:channelConfig, offerConstraints:{}})
    peer.on('signal', function (data) {
        console.log('PEER signal')
        //console.log(data)
        ws.send(JSON.stringify(data));
    })
    var interval = null;
    peer.on('connect', function(){
        console.log('PEER connected');
        peers[id] = peer;
        state[id] = [0,0];
    });
    peer.on('data', function(data){
        /*
        console.log('PEER data');
        console.log(data);
        console.log(typeof data);
        console.log(data.length);
        */
        state[id][0] = data.readInt16LE(0);
        state[id][1] = data.readInt16LE(2);
    });
    peer.on('error', function(err){
        console.log('PEER onerror');
        console.log(err);
        delete peers[peer];
        delete peers[id];
    });
    peer.on('close', function(){
        console.log('PEER onclose');
        delete peers[peer];
        delete peers[id];
    });
    ws.on('message', function(message) {
        console.log('WEBSOCKET onmessage');
        var data = JSON.parse(message);
        peer.signal(data);
    });
    ws.on('close', function close() {
        console.log('WEBSOCKET disconnected');
    });
});

