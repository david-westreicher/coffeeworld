class Input
    constructor: (div) ->
        div = div || window
        div.addEventListener 'keydown', @onkeydown, false
        div.addEventListener 'keyup', @onkeyup, false
        @downkeys = {}
    onkeydown: (event) =>
        # console.log 'down'
        # console.log event
        @downkeys[event.keyCode] = true
    onkeyup: (event) =>
        # console.log 'up'
        # console.log event
        delete @downkeys[event.keyCode]
    isdown: (key) =>
        return key of @downkeys

module.exports = Input
