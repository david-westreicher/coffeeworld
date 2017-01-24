const vec2 = require('gl-matrix').vec2

module.exports.normal_from_points = (start, end, out)=>{
    const normal = vec2.sub(out || vec2.create(), start, end)
    vec2.set(normal, normal[1], -normal[0])
    vec2.normalize(normal,normal)
    return normal
}
