import rand from 'random-seed'

class Renderer{
    constructor(){
        this.divs = []
        this.colors = new Map()
        this.infobox = document.createElement('div')
        document.body.appendChild(this.infobox)
    }

    getcolor(id){
        let color = this.colors.get(id)
        if(!color){
            const tmprand = rand.create(id)
            for(let i=0;i<id;i++)
                tmprand(10)
            const letters = '0123456789ABCDEF'.split('')
            color = '#'
            for(let i=0;i<6;i++)
                color += letters[tmprand(16)]
            this.colors.set(id,color)
        }
        return color
    }

    newdiv(){
        let div = document.createElement('div')
        div.style.position = 'absolute'
        div.style.width = '10px'
        div.style.height = '10px'
        div.style.background = '#00ff00'
        document.body.appendChild(div)
        this.divs.push(div)
    }

    render(state, id){
        this.infobox.innerHTML = 'server: ' + state.get(id) + ', id: ' + id
        this.infobox.style.background = this.getcolor(id)

        while(this.divs.length < state.size){
            this.newdiv()
        }
        while(this.divs.length > state.size){
            const div = this.divs.pop()
            div.parentNode.removeChild(div)
        }
        let divi = 0
        for(const [id, pos] of state){
            const div = this.divs[divi]
            div.style.background = this.getcolor(id)
            div.style.left = pos[0] + 'px'
            div.style.top = pos[1] + 'px'
            divi++
        }
    }
}


export default Renderer
