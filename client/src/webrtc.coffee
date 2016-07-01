Peer = require 'simple-peer'


class WebRTC
    constructor: (@ws, @conn_cbk, @data_cbk) ->
        @arrbuff = new Int16Array([0,0])

    connect: () ->
        connection = new WebSocket @ws
        connection.onopen = () =>
            console.log 'WEBSOCKET onopen'
            console.log @
            @peer = new Peer()
            @peer.on 'signal', (data) ->
                console.log 'WEBRTC onsignal'
                console.log data
                connection.send JSON.stringify(data)
            @peer.on 'connect', () =>
                connection.close()
                @conn_cbk()
            @peer.on 'data', (data) =>
                @data_cbk data
            @peer.on 'close', () =>
                console.log 'WEBRTC onclose'

        connection.onmessage = (e) =>
            console.log 'WEBSOCKET onmessage'
            data = JSON.parse(e.data)
            console.log data
            @peer.signal data

        connection.onerror = (error) ->
            console.log error
            console.log 'WEBSOCKET onerror'

    send: (pos) ->
        @arrbuff[0] = pos[0]
        @arrbuff[1] = pos[1]
        if @peer.connected
            @peer.send @arrbuff

module.exports = WebRTC
