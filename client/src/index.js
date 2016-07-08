import GameClient from './game/client'

(() =>{
    const game = new GameClient()
    let main = () => {
        window.requestAnimationFrame(main)
        game.tick()
    }
    main()
})()
