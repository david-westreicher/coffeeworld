module.exports = {
    client_tickrate: 33,
    server_tickrate: 33,
    server_ip: 'ws://localhost:9000',
    get_entitysnapshot: () => {
        return {
            x: 200.1,
            y: 200.1,
            playerid: 0,
        }
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
