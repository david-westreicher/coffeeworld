# Coffeeworlds

This is a prototype of a **networking framework** for action games (**SHOOTER, RACING, ...**).

It is however **NOT SUITED FOR: RTS, MMORPG, ...**

## Run
```
$ docker-compose up --build -d
```
and visit `localhost:8080`

## Documentation
**Coffeeworlds** implements some ideas of the [Quake 3 Networking Model](http://fabiensanglard.net/quake3/network.php).

Some definitions:
  1. an `entity` is a serializable object (e.g.: `{posx: 23.2, posy: 43.9}`)
  2. a `state` is a map from `ids` to `entities`
  3. a `command` is a serializable object (e.g.: `{mousedown: true, leftarrow: false}`)

Control-flow:
  1. Client-Server model implemented ontop of [WebRTC](https://en.wikipedia.org/wiki/WebRTC)
  2. **Clients** only **sends** `commands`: pressed keys, mouse position, ...
  3. **Server** **processes** the `commands` and **broadcasts** the resulting `state` to the Clients
  4. **Clients** **receive** the `state` and renders it

The framework takes care of the communication of `commands` and `states`.
In order to serialize them (to binary) we need a static definition (can't add properties) of it's types (see `game/config.js`).

For instance 
  * commands: 

    ```
    command = {
        left: false,
        right: true,
        up: false,
        down: false
    }
    ```
    
    will get translated to only one byte (bit-packing)
  * states: 

    ```
    state = {
        59: {
            posx: 23.45, 
            posy: 67.89
        },
        28: {
            posx: 37.19,
            posy: 51.48}
        }
    }
    ```
    
    will get translated into `[59, 23.45, 67.89, 28, 37.19, 51.48]` and needs `20 = 16 (4 floats) + 4 (2*id -> int16)` bytes

## Example Game - cubes
`game/` - a simple example game (one cube per player, move with arrow keys). each entity 
  * `client.js` -
    * every frame: render all entities of state with cubes
    * every nettick: send arrow keys and mouse input
  * `config.js` - defines the command/entity protocol, tickrate and server ip
  * `input.js` - handles mouse and keyboard input (async, not polled)
  * `renderer.js` - takes a state of entities and renders it (CSS absolute)
  * `server.js` - 
    * new player joined -> generate new entity and set playerid
    * player left -> remove entity with corresponding playerid
    * every tick: 
      * for every player command: move player entity, if mousedown -> spawn bullet
      * for every bullet: move bullet
  * `input.js` - simple wrapper for synchronous input polling

## Development
The actual game code is located in the `game` folder.


**NOTICE: `game/server.js` and `game/client.js` are the fixed entry points of the framework. Don't rename them!**

To start a new game: 
  1. create a `game/config.js`

    ```
    module.exports = {
        client_tickrate: 33, // sends 33 commands per second to the server
        server_tickrate: 33, // broadcasts the state 33 times per second
        server_ip: 'ws://10.0.0.76:9000',
        get_entitysnapshot: fun1, // fun1 should create entity objects
        get_command: fun2 // fun2 should create command objects
    }
    ```

  2. create a `game/server.js`

    ```
    const GameServer = require('../gameserver')
    const Config = require('./config')
    class MyServer extends GameServer{
        constructor(){
            super(Config)
        }
        new_player(playerid){
            // could spawn some entities
        }
        player_left(playerid){
            // could delete some entities
        }
        tick(state, cmds){
            // process all commands and update the state
            // could also spawn/delete/... entities
        }
    }
    ```
    
  3. create a `game/client.js`

    ```
    import Client from '../client'
    import Config from './config'
    class MyClient extends Client{
        constructor(){
            super(Config)
            // setup the renderer, input, audio, ...
            super.on_new_frame(this.tick.bind(this)) // start tick loop
        }
        update_command(command){
            // update the command object (probably from input)
        }
        tick(state){
            // render state
        }
    }
    // start connecting to the server
    new MyClient().connect()
    ```

Now you can start developing

  1. start the docker containers once and *login*

    ```
    // in first terminal
    $ docker-compose up --build -d
    $ docker exec -it webrtc-container bash
    
    // in second terminal
    $ docker attach --sig-proxy=false webpack-container 
    ```

  2. edit any `*.js/*.html` file

    ```
    // you should see changes in the second terminal (webpack-container)
    // in first terminal
    # ./restart.sh
    ```

  3. reload `localhost:8080` and **goto 2.**

### Code Structure
  * `client/`
    * `public/` - the folder which is served with the httpserve-container
      * `index.html` - empty html which just inserts the generated 
      * `bundle.js`
    * `src/`
      * `client.js` - handles the Client-Server communication
        * sends cmds to the server
        * updates client state with received state
      * `webrtc.js` - connects to the server's WebSocket and establishes the WebRTC connection
    * `package.json` - defines the client dependencies
    * `httpserve.dock` - the docker image for the static http server (serves `public/`)
    * `webpack.dock` - the docker image for continuous development (generates `public/bundle.js` from `src/` and `shared/`)
  * `server/`
    * `src/`
      * `server.js` - uses a [WebSocket](https://www.npmjs.com/package/ws) for WebRTC signalling
      * `gameserver.js` - handles the Client-Server communication: 
        * manages player-ids
        * translates commands to events
        * broadcasts new state
    * `package.json` - defines the server dependencies
    * `restart.sh` - handy utility to restart the server if changes were made
    * `webrtc.dock` - the docker image for a gameserver
  * `game/` - contains the actual game code: logic, renderer, input
  * `shared/` - contains code for `client` and `server`
    * `byteencoder` - handles conversion between objects and bytebuffer
    * `statemanager` - handles conversion between game state and bytebuffer, manages entity ids
  * `docker-compose.yml` - configures the docker containers, copies the `shared/` and `game/` folder into `client/` and `server/`
