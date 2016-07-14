class NetworkStats{
    constructor(){
        this._bytes_received = 0
        this._bytes_sent = 0
        this.bps_received = 0
        this.bps_sent = 0
        this.ping = -1
        setInterval(() => {
            this.bps_received = this._bytes_received
            this.bps_sent = this._bytes_sent
            this._bytes_received = 0
            this._bytes_sent = 0
        }, 1000)
    }

    bytes_sent(bytes){
        if(bytes)
            this._bytes_sent += bytes
        return this.bps_sent
    }

    bytes_received(bytes){
        if(bytes)
            this._bytes_received += bytes
        return this.bps_received
    }
}

module.exports = NetworkStats
