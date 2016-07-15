class Input{
    constructor(div){
        this.div = div || window
        this.downkeys = new Set()
        this.mousedown = false
        this.mousex = 0
        this.mousey = 0
        this.islocked = false
        this.div.addEventListener('keydown', (event) => { this.downkeys.add(event.keyCode) }, false)
        this.div.addEventListener('keyup', (event) => { this.downkeys.delete(event.keyCode) }, false)
        this.div.addEventListener('mouseout', this.not_active.bind(this), false)
        document.onmousedown = () => { this.mousedown = true }
        document.onmouseup = () => { this.mousedown = false }
        document.onmousemove = (event) => {
            if(this.islocked){
                this.mousex += event.movementX
                this.mousey += event.movementY
            }else{
                this.mousex = event.clientX - window.innerWidth/2
                this.mousey = event.clientY - window.innerHeight/2
            }
        }
        window.onblur = () => { this.not_active(this) }
    }
    reset(){
        if(this.islocked){
            this.mousex = 0
            this.mousey = 0
        }
    }
    not_active(){
        // TODO not active is called too many times :(
        //this.downkeys.clear()
        //this.mousedown = false
    }
    isdown(key){
        return this.downkeys.has(key)
    }
    toggle_lock(){
        this.islocked = !this.islocked
    }
}

export default Input
