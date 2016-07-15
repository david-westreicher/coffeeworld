class AccurateTimer{
    constructor(fun, time, gettime){
        this.fun = fun
        this.waittime = time
        this.gettime = gettime
        //this.ticks = 0
        //this.nextsecond = gettime()
    }
    start(){
        this.nexttick = this.gettime()
        setInterval(this.check.bind(this),1)
    }
    check(){
        const now = this.gettime()
        /*if(now>this.nextsecond){
            console.log(this.ticks)
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
