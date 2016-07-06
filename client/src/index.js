import SampleGame from './examples/cubes/game'

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
