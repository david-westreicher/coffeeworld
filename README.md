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
  1. Client-Server model implemented ontop of [WebRTC](https://en.wikipedia.org/wiki/WebRTC)
  2. Client only sends commands: pressed keys, mouse position, ...
  3. Server processes the commands and broadcasts the resulting state to the Clients
  4. Clients receive the snapshot and renders them

### Code Structure
  * `client/`
    * `public/` - the folder which is served with the httpserve-container
      * `index.html` - empty html which just inserts the generated `bundle.js`
    * `src/`
      * `game.js` - handles the Client-Server communication
        * sends cmds to the server
        * updates client state with received snapshots
      * `index.js` - contains the main loop
      * `input.js` - simple wrapper for synchronous input polling
      * `webrtc.js` - connects to the server's WebSocket and establishes the WebRTC connection
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
  * `shared/` - contains the actual game code: renderer, snapshot <--> state conversion, cmd <--> event conversion
    * `config.js` - declare which game to load here
  * `docker-compose.yml` - configures the docker containers, moves the `shared/` folder into `client/` and `server/`

## Development
Every game should be located in a `shared/<game-name>` folder. 
It should use the same file structure as the example game: **cubes**

`cubes/` - a simple example game (one cube per player, move with arrow keys)
  * `game.js` - implements the necessary functions of a `Game`:
    * client
      * for every input generate a new cmd (bitencode the arrow keys with one `int`)
      * for every entity received: extract entity position
    * server
      * new players have position [200, 200]
      * for every cmd received: extract x,y of pressed arrow keys (bitunpack of one `int`) and generate event(x,y)
      * for every entity to send: add position
      * for every event: update entity position to event(x,y)
  * `renderer.js` - takes a state as input and renders it (CSS absolute position)


To start a new project: 
  1. `cp -r shared/cubes shared/newproject`
  2. edit the `shared/config.js` with `game: 'newproj'`

Now you can start developing

  1. start the docker containers once and *login*

    ```
    // in first terminal
    $ docker-compose up --build -d
    $ docker exec -it webrtc-container bash
    
    // in second terminal
    $ docker attach --sig-proxy=false webpack-container 
    ```

  2. edit `shared/cubes/*.js`  or `client/src` or `server/src`

    ```
    // you should see changes in the second terminal (webpack-container)
    // in first terminal
    # ./restart.sh
    ```

  3. reload `localhost:8080` and **goto 2.**
