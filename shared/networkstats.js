class NetworkStats{
    constructor(){
        this.bps_received = 0
        this._bytes_received = 0
        this.bps_sent = 0
        this._bytes_sent = 0
        this.packets = 0
        this._packets = 0
        this.ping = -1
        setInterval(() => {
            this.bps_received = this._bytes_received*8.0/1000.0
            this._bytes_received = 0
            this.bps_sent = this._bytes_sent*8.0/1000.0
            this._bytes_sent = 0
            this.packets = this._packets
            this._packets = 0
        }, 1000)
    }

    bytes_sent(bytes){
        if(bytes){
            this._bytes_sent += bytes
            this._packets++
        }
        return this.bps_sent
    }

    packets_send(){
        return this.packets
    }

    bytes_received(bytes){
        if(bytes)
            this._bytes_received += bytes
        return this.bps_received
    }
}

module.exports = NetworkStats
