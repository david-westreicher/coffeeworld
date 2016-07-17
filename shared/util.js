class AccurateTimer{
    constructor(fun, time){
        this.gettime = null
        const is_client = typeof process.hrtime === 'undefined'
        if(is_client){
            this.gettime = window.performance.now.bind(window.performance)
        }else{
            this.gettime = ()=>{
                const now = process.hrtime()
                return now[0]*1e3 + now[1]*1e-6
            }
        }
        this.fun = fun
        this.waittime = time
        this.ticks = 0
        this.nextsecond = this.gettime()
    }
    start(){
        this.nexttick = this.gettime()
        this.check_task = setInterval(this.check.bind(this),1)
    }
    stop(){
        clearInterval(this.check_task)
    }
    check(){
        const now = this.gettime()
        if(now>this.nextsecond){
            //console.log(this.ticks)
            this.nextsecond = now + 1000
            this.ticks = 0
        }
        if(now<this.nexttick)
            return
        const missed_ticks = (now-this.nexttick)/this.waittime
        if(missed_ticks > 5){
            this.nexttick = now
            console.log('[AccurateTimer] missed ticks: ' + Math.floor(missed_ticks))
        }
        this.nexttick += this.waittime
        this.fun()
        this.ticks++
    }
}

module.exports = AccurateTimer
