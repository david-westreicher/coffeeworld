import SampleGame from './samplegame/game'

(() =>{
    const game = new SampleGame()
    let main = () => {
        window.requestAnimationFrame(main)
        game.tick()
        game.send_to_server()
        game.render()
    }
    main()
})()
