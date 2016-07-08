import GameClient from './shared/gameclient'

(() =>{
    const game = new GameClient()
    let main = () => {
        window.requestAnimationFrame(main)
        game.tick()
    }
    main()
})()
