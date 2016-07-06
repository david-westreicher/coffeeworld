class Input{
    constructor(div){
        this.div = div || window
        this.downkeys = new Set()
        this.div.addEventListener('keydown', (event) => { this.downkeys.add(event.keyCode) }, false)
        this.div.addEventListener('keyup', (event) => { this.downkeys.delete(event.keyCode) }, false)
        this.div.addEventListener('mouseout', this.not_active.bind(this), false)
        window.onblur = () => { this.not_active(this) }
    }
    not_active(){
        this.downkeys.clear()
    }
    isdown(key){
        return this.downkeys.has(key)
    }
}

export default Input
