import Config from './shared/config'
import GameClient from './shared/gameclient'

(() =>{
    const game = new GameClient(Config.server_ip)
    let main = () => {
        window.requestAnimationFrame(main)
        game.tick()
    }
    main()
})()
