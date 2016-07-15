class AccurateTimer{
    constructor(fun, time){
        this.fun = fun
        this.waittime = time
        //this.ticks = 0
        //this.nextsecond = window.performance.now()
    }
    start(){
        this.nexttick = window.performance.now() 
        setInterval(this.check.bind(this),1)
    }
    check(){
        const now = window.performance.now()
        /*if(now>this.nextsecond){
            conosole.log()
            this.nextsecond = now + 1000
            this.ticks = 0
        }*/
        if(now<this.nexttick)
            return
        this.nexttick += this.waittime
        this.fun()
        //this.ticks++
    }
}

module.exports = AccurateTimer
