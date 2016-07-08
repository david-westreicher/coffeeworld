import rand from 'random-seed'

class Renderer{
    constructor(){
        this.player_divs = []
        this.bullet_divs = []
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

    new_player_div(){
        let div = document.createElement('div')
        div.style.position = 'absolute'
        div.style.width = '10px'
        div.style.height = '10px'
        div.style.background = '#00ff00'
        document.body.appendChild(div)
        this.player_divs.push(div)
    }

    new_bullet_div(){
        let div = document.createElement('div')
        div.style.position = 'absolute'
        div.style.width = '2px'
        div.style.height = '2px'
        div.style.background = '#000000'
        document.body.appendChild(div)
        this.bullet_divs.push(div)
    }

    render(players, id, bullets){
        this.infobox.innerHTML = ', entity_id: ' + id
        this.infobox.style.background = this.getcolor(id)

        while(this.player_divs.length < players.size){
            this.new_player_div()
        }
        while(this.player_divs.length > players.size){
            const div = this.player_divs.pop()
            div.parentNode.removeChild(div)
        }
        let divi = 0
        for(const [id, entity] of players){
            const div = this.player_divs[divi]
            div.style.background = this.getcolor(id)
            div.style.left = entity.x + 'px'
            div.style.top = entity.y + 'px'
            divi++
        }

        while(this.bullet_divs.length < bullets.size){
            this.new_bullet_div()
        }
        while(this.bullet_divs.length > bullets.size){
            const div = this.bullet_divs.pop()
            div.parentNode.removeChild(div)
        }

        divi = 0
        for(const [_, entity] of bullets){
            const div = this.bullet_divs[divi]
            div.style.left = entity.x + 'px'
            div.style.top = entity.y + 'px'
            divi++
        }
    }
}


export default Renderer
