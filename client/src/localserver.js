import Server from './shared/server'

class LocalServer extends Server{
    constructor(){
        super()
        this.on('log', this.log.bind(this))
        setInterval(this.updatedom.bind(this), 1000)
    }

    log(type, text){
        const log_div = document.getElementById('log')
        const new_log = document.createElement('div')
        new_log.innerHTML = text
        new_log.style.color = '#FFFFFF'
        switch(type){
        case 'info':
            new_log.style.background = '#03A9F4'
            break
        case 'success':
            new_log.style.background = '#CCDB38'
            break
        case 'fail':
            new_log.style.background = '#E81DB4'
            break
        }
        log_div.insertBefore(new_log, log_div.firstChild)
    }

    updatedom(){
        const stats = this.network.stats
        const status_text = 
            'packets/sec: ' + stats.packets_send()      + ', ' +
            'kbps out: '    + stats.bytes_sent()        + ', ' +
            'kbps in: '     + stats.bytes_received()    + ', '
        document.getElementById('status').innerHTML = status_text


        let players_text = ''
        for(const id of this.peerids.values()){
            players_text += id + ', '
        }
        document.getElementById('players').innerHTML = players_text
    }
}

new LocalServer()
