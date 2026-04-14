import Particle from "../../Wolfie2D/Nodes/Graphics/Particle";
import ParticleSystem from "../../Wolfie2D/Rendering/Animations/ParticleSystem";
import Scene from "../../Wolfie2D/Scene/Scene";
import OrthogonalTilemap from "../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import Color from "../../Wolfie2D/Utils/Color";
import { EaseFunctionType } from "../../Wolfie2D/Utils/EaseFunctions";
import RandUtils from "../../Wolfie2D/Utils/RandUtils";
import { MBPhysicsGroups } from "../MBPhysicsGroups";

/**
 * The particle system used for the player's weapon
 */
export default class PlayerWeapon extends ParticleSystem {

    /**
     * The rotation (in radians) to apply to the velocity vector of the particles
     */
    protected _rotation: number = 0;
    private _tilemap: OrthogonalTilemap | null = null;
    private readonly PARTICLE_GRAVITY = 400;

    public get rotation(): number { return this._rotation; }
    public set rotation(rotation: number) { this._rotation = rotation; }

    public setTilemap(tilemap: OrthogonalTilemap): void {
        this._tilemap = tilemap;
    }

    public isSystemRunning(): boolean { return this.systemRunning; }
    /**
     * 
     * @returns the particles in the pool of particles used in this particles system
     */
    public getPool(): Array<Particle> { return this.particlePool; }

    /**
     * Sets the animations for a particle in the player's weapon
     * @param particle the particle to give the animation to
     */
    public setParticleAnimation(particle: Particle) {
        // Give the particle a random velocity.
        particle.vel = RandUtils.randVec(-32, 32, 100, 200);
        // Rotate the particle's velocity vector
        particle.vel.rotateCCW(this._rotation);
        particle.color = Color.MAGENTA;

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
                }
            ]
        });
    }

    public update(deltaT: number): void {
        super.update(deltaT);

        if (!this._tilemap) return;

        for (const particle of this.particlePool) {
            if (!particle.inUse) continue;

            // Apply gravity to velocity
            particle.vel.y += this.PARTICLE_GRAVITY * deltaT;

            // Check collision at particle position + a few pixels down
            if (this._hitsTile(particle.position.x, particle.position.y + 2)) {
                // Stop vertical movement, add friction to horizontal
                particle.vel.y = 0;
                particle.vel.x *= 0.85;
            }
        }
    }

    private _hitsTile(x: number, y: number): boolean {
        if (!this._tilemap) return false;
        const cell = this._tilemap.getColRowAt({ x, y } as any);
        return this._tilemap.isTileCollidable(cell.x, cell.y);
    }

    public initializePool(scene: Scene, layer: string) {
        super.initializePool(scene, layer);
        for (let i = 0; i < this.particlePool.length; i++) {
            // Set particle physics group to the player's weapon
            this.particlePool[i].setGroup(MBPhysicsGroups.PLAYER_WEAPON);
        }
    }

}