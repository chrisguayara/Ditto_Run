import Particle from "../../Wolfie2D/Nodes/Graphics/Particle";
import ParticleSystem from "../../Wolfie2D/Rendering/Animations/ParticleSystem";
import Scene from "../../Wolfie2D/Scene/Scene";
import OrthogonalTilemap from "../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import Color from "../../Wolfie2D/Utils/Color";
import { EaseFunctionType } from "../../Wolfie2D/Utils/EaseFunctions";
import RandUtils from "../../Wolfie2D/Utils/RandUtils";
import { MBPhysicsGroups } from "../MBPhysicsGroups";

export default class PlayerWeapon extends ParticleSystem {
    protected _rotation: number = 0;
    private _tilemap: OrthogonalTilemap | null = null;

    // Shotgun feel — gravity drags them down quickly
    private readonly PARTICLE_GRAVITY = 600;

    public get rotation(): number { return this._rotation; }
    public set rotation(r: number) { this._rotation = r; }
    public setTilemap(t: OrthogonalTilemap): void { this._tilemap = t; }
    public isSystemRunning(): boolean { return this.systemRunning; }
    public getPool(): Array<Particle> { return this.particlePool; }

    public setParticleAnimation(particle: Particle): void {
        // Wide spread, moderate speed — shotgun pellets
        particle.vel = RandUtils.randVec(-60, 60, 40, 120);
        particle.vel.rotateCCW(this._rotation);
        particle.color = Color.MAGENTA;

        particle.tweens.add("active", {
            startDelay: 0,
            duration: this.lifetime,
            effects: [{
                property: "alpha",
                start: 1,
                end: 0,
                ease: EaseFunctionType.IN_OUT_SINE
            }]
        });
    }

    public update(deltaT: number): void {
        super.update(deltaT);
        if (!this._tilemap) return;

        for (const particle of this.particlePool) {
            if (!particle.inUse) continue;
            particle.vel.y += this.PARTICLE_GRAVITY * deltaT;
            if (this._hitsTile(particle.position.x, particle.position.y + 2)) {
                particle.vel.y = 0;
                particle.vel.x *= 0.80;
            }
        }
    }

    private _hitsTile(x: number, y: number): boolean {
        if (!this._tilemap) return false;
        const cell = this._tilemap.getColRowAt({ x, y } as any);
        return this._tilemap.isTileCollidable(cell.x, cell.y);
    }

    public initializePool(scene: Scene, layer: string): void {
        super.initializePool(scene, layer);
        for (const p of this.particlePool) {
            p.setGroup(MBPhysicsGroups.PLAYER_WEAPON);
        }
    }
}