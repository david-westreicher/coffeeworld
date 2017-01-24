module.exports = {
    client_tickrate: 60,
    server_tickrate: 60,
    lobby_ip: 'ws://localhost:9000',
    stun_ip: 'localhost:3478',
    local_play: true,
    debug: true,
    get_entities:{
        player: () => {
            return {
                x: 200,
                y: 200,
                hookx: 200,
                hooky: 200,
                playerid: 0,
                size: 10,
            }
        },
        food: () => {
            return {
                x: 200,
                y: 200,
                size: 200,
            }
        },
        debug: () => {
            return {
                x0: 200.1,
                y0: 200.1,
                x1: 200.1,
                y1: 200.1,
            }
        },
    },
    get_command: () => {
        return {
            left: false,
            right: false,
            up: false,
            down: false,
            mousedown: false,
            mousex: 0,
            mousey: 0,
        }
    },
}
