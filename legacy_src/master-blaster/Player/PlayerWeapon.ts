import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Particle from "../../Wolfie2D/Nodes/Graphics/Particle";
import ParticleSystem from "../../Wolfie2D/Rendering/Animations/ParticleSystem";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import { EaseFunctionType } from "../../Wolfie2D/Utils/EaseFunctions";
import MathUtils from "../../Wolfie2D/Utils/MathUtils";
import RandUtils from "../../Wolfie2D/Utils/RandUtils";
import { MBEvents } from "../MBEvents";
import { MBPhysicsGroups } from "../MBPhysicsGroups";

 

/**
 * // TODO get the particles to move towards the mouse when the player attacks
 * 
 * The particle system used for the player's attack. Particles in the particle system should
 * be spawned at the player's position and fired in the direction of the mouse's position.
 */
export default class PlayerWeapon extends ParticleSystem {
    public vector: Vec2;

    public getPool(): Readonly<Array<Particle>> {
        return this.particlePool;
    }

    /**
     * @returns true if the particle system is running; false otherwise.
     */
    public isSystemRunning(): boolean { return this.systemRunning; }

    /**
     * Sets the animations for a particle in the player's weapon
     * @param particle the particle to give the animation to
     */
    public setDirection(vector : Vec2){
        this.vector = vector.clone().normalize();
    }
    public getDirection(){
        return this.vector;
    }
    public normalize(vec :Vec2){
        return Math.sqrt( vec[0] * vec[0]+ vec[1] * vec[1] );
    }
    public initializePool(scene: Scene, layer: string): void {
        super.initializePool(scene, layer);

        for (let particle of this.particlePool) {
            particle.addPhysics();
            particle.setGroup(MBPhysicsGroups.PLAYER_WEAPON)
        }
    }
    public setParticleAnimation(particle: Particle) {
        particle.setGroup(MBPhysicsGroups.PLAYER_WEAPON);
        
        

        const spread = RandUtils.randFloat(-40,40);
        const dir = this.vector ?? Vec2.RIGHT;

        const speed = RandUtils.randFloat(140, 220);
        const perp = new Vec2(-dir.y, dir.x);

        particle.vel = dir.scaled(speed).add(perp.scaled(spread));

        let pcolor = RandUtils.randFloat(0,1)
        if (pcolor >= 0.5){particle.color = Color.fromStringHex("6848fc");}
        else particle.color = Color.BLACK;
        

        // Give the particle tweens
        particle.tweens.add("active", {
            startDelay: 0,
            duration: this.lifetime,
            effects: [
                {
                    property: "alpha",
                    start: 1,
                    end: 0,
                    ease: EaseFunctionType.IN_OUT_SINE
                },
                {
                    property: "rotation",
                    start: 0,
                    end: 2* Math.PI,
                    ease: EaseFunctionType.IN_OUT_QUAD
                }
            ]
        });
    }

}