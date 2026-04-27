import Particle from "../../Wolfie2D/Nodes/Graphics/Particle";
import ParticleSystem from "../../Wolfie2D/Rendering/Animations/ParticleSystem";
import Scene from "../../Wolfie2D/Scene/Scene";
import OrthogonalTilemap from "../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import Color from "../../Wolfie2D/Utils/Color";
import { EaseFunctionType } from "../../Wolfie2D/Utils/EaseFunctions";
import RandUtils from "../../Wolfie2D/Utils/RandUtils";
import { MBPhysicsGroups } from "../MBPhysicsGroups";

export default class PhantumpWeapon extends ParticleSystem {
    protected _rotation: number = 0;
    private _tilemap: OrthogonalTilemap | null = null;

    public get rotation(): number { return this._rotation; }
    public set rotation(r: number) { this._rotation = r; }
    public setTilemap(t: OrthogonalTilemap): void { this._tilemap = t; }
    public isSystemRunning(): boolean { return this.systemRunning; }
    public getPool(): Array<Particle> { return this.particlePool; }

    public setParticleAnimation(particle: Particle): void {
        // Tight spread, very fast — sniper feel
        particle.vel = RandUtils.randVec(-15, 15, 400, 600);
        particle.vel.rotateCCW(this._rotation);
        particle.color = new Color(160, 32, 240); // purple

        particle.tweens.add("active", {
            startDelay: 0,
            duration: this.lifetime,
            effects: [{
                property: "alpha",
                start: 1,
                end: 0,
                ease: EaseFunctionType.IN_SINE
            }]
        });
    }

    public update(deltaT: number): void {
        super.update(deltaT);
        // No gravity — straight shots only
    }

    public initializePool(scene: Scene, layer: string): void {
        super.initializePool(scene, layer);
        for (const p of this.particlePool) {
            p.setGroup(MBPhysicsGroups.PLAYER_WEAPON);
        }
    }
}