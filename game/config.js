module.exports = {
    client_tickrate: 33,
    server_tickrate: 33,
    server_ip: 'ws://localhost:9000',
    local_play: false,
    get_entities:{
        player: () => {
            return {
                x: 200.1,
                y: 200.1,
                hookx: 200,
                hooky: 200,
                playerid: 0,
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
