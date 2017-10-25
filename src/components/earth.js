import {
    SphereGeometry,
    TextureLoader,
    MeshBasicMaterial,
    MeshLambertMaterial,
    Mesh
} from 'three';
import {group} from './scene';
class Earth{
    constructor(opts={
        radius: 150,
        horFragment: 60,
        verFragment: 60,
        texture: true,
        textureUrl: '/texture/world.jpg'
    }){
        this.opts = Object.assign({},opts);
        let geo = new SphereGeometry(this.opts.radius, this.opts.horFragment, this.opts.verFragment),
            loader = new TextureLoader(),
            mesh,
            material;
        if (this.opts.texture) {
            loader.load(this.opts.textureUrl, (texture) => {
                material = new MeshBasicMaterial({map: texture, overdraw: 0.5});
                mesh = new Mesh(geo, material);
                group.add(mesh);
            });
        } else {
            material = new MeshBasicMaterial({color:0x000000});
            mesh = new Mesh(geo, material);
            group.add(mesh);
        }
    }
};
export default Earth;