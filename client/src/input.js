class Input{
    constructor(div){
        this.div = div || window
        this.downkeys = {}
        this.div.addEventListener('keydown', (event) => { this.downkeys[event.keyCode] = true }, false)
        this.div.addEventListener('keyup', (event) => { delete this.downkeys[event.keyCode] }, false)
    }
    isdown(key){
        return this.downkeys[key]
    }
}

export default Input
