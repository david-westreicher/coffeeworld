import Game from './game'
import Cubes from './shared/cubes/game'
import Renderer from './shared/cubes/renderer'

(() =>{
    const game = new Game(new Cubes(), new Renderer())
    let main = () => {
        window.requestAnimationFrame(main)
        game.tick()
        game.send_to_server()
        game.render()
    }
    main()
})()
