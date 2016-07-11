module.exports = {
    client_tickrate: 33,
    server_tickrate: 33,
    server_ip: 'ws://localhost:9000',
    get_entities:{
        player: () => {
            return {
                x: 200.1,
                y: 200.1,
                playerid: 0,
            }
        },
        bullet: () => {
            return {
                x: 200.1,
                y: 200.1,
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
