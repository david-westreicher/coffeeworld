'use strict'


class SampleGame{
    constructor(){
        this.state = new Map()
        this.cmds = []
    }

    cmd_from_data(data){
        // TODO better use cycling array of tmpcmds
        const tmpCmd = {
            id: 0,
            pos: [0.0, 0.0],
            type: 'normal'
        }
        tmpCmd.id = data.readInt16LE(0)
        tmpCmd.pos[0] = data.readInt16LE(2)
        tmpCmd.pos[1] = data.readInt16LE(4)
        return tmpCmd
    }

    add_cmd(cmd){
        this.cmds.push(cmd)
    }

    tick(){
        for(const cmd of this.cmds){
            switch(cmd.type){
                case 'normal':
                    this.state.set(cmd.id, cmd.pos)
                    break
                case 'delete':
                    this.state.delete(cmd.id)
                    break
            }
        }
        this.cmds = []
    }

    buff_from_id(id){
        const intsperplayer = 3 // id: 1, pos: 2
        const players = this.state.size
        const messagebuf = new Int16Array(players*intsperplayer)
        let index = 0
        for(const [id, pos] of this.state){
            messagebuf[index++] = id
            messagebuf[index++] = pos[0]
            messagebuf[index++] = pos[1]
        }
        return messagebuf
    }


}

module.exports = SampleGame 
