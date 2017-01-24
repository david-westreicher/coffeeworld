import rand from 'random-seed'
import THREE from 'three'

class Renderer{
    constructor(pointerlockcallback){

        this.scene = new THREE.Scene()
        this.scene.add( new THREE.AmbientLight( 0x404040 ) )
        this.addtoscene()
        this.material = 
        this.appearance = {
            player: {
                geom: new THREE.SphereGeometry(10),
                material: new THREE.MeshNormalMaterial()
            },
            bullet: {
                geom: new THREE.SphereGeometry(5),
                material: new THREE.MeshLambertMaterial({ side: THREE.DoubleSide })
            }
        }
        this.meshes = {
            player: [],
            bullet: [],
        }

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 1, 2000)
        this.camera.position.z = 400
        this.camera.lookAt(this.scene.position)

        this.renderer = new THREE.WebGLRenderer({ antialias: true })
        this.renderer.setPixelRatio(window.devicePixelRatio)
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        const container = document.createElement('div')
        document.body.appendChild(container)
        container.appendChild(this.renderer.domElement)
        container.onclick = () => {
            container.requestPointerLock()
        }
        document.onpointerlockchange = () => {
            pointerlockcallback()
        }

        window.addEventListener('resize', this.onWindowResize.bind(this), false)
    }

    addtoscene(){
        /*
        let object = new THREE.Mesh( new THREE.SphereGeometry( 75, 20, 10 ), material)
        object.position.set( -400, 0, 200 )
        this.scene.add( object )

        object = new THREE.Mesh( new THREE.IcosahedronGeometry( 75, 1 ), material)
        object.position.set( -200, 0, 200 )
        this.scene.add( object )

        object = new THREE.Mesh( new THREE.OctahedronGeometry( 75, 2 ), material)
        object.position.set( 0, 0, 200 )
        this.scene.add( object )

        object = new THREE.Mesh( new THREE.TetrahedronGeometry( 75, 0 ), material )
        object.position.set( 200, 0, 200 )
        this.scene.add( object )
        */
    }

    
    onWindowResize() {
        this.camera.aspect = window.innerWidth/window.innerHeight
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(window.innerWidth, window.innerHeight)
    }

    fillmeshes(meshes, state, appearance){
        while(meshes.length<state.size){
            const mesh = new THREE.Mesh(appearance.geom, appearance.material)
            meshes.push(mesh)
            this.scene.add(mesh)
        }
        while(meshes.length>state.size){
            const mesh = meshes.pop()
            this.scene.remove(mesh)
        }
    }

    setpositions(meshes, state){
        let meshindex = 0
        for(const [id, entity] of state){
            const mesh = meshes[meshindex++]
            mesh.position.set(entity.x, -entity.y, 0)
        }
    }

    render(players, id, bullets){
        this.fillmeshes(this.meshes.player, players, this.appearance.player)
        this.fillmeshes(this.meshes.bullet, bullets, this.appearance.bullet)
        this.setpositions(this.meshes.player, players)
        this.setpositions(this.meshes.bullet, bullets)

        this.renderer.render(this.scene, this.camera)
    }
}


export default Renderer
