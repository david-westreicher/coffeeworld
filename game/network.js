class Network{

    static get_entitysnapshot(){
        return {
            x: 200.1,
            y: 200.1,
            playerid: 0,
        }
    }

    static get_command(){
        return {
            left: false,
            right: false,
            up: false,
            down: false,
        }
    }
}

module.exports = Network
