import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import MBAnimatedSprite from "../../Nodes/MBAnimatedSprite";
import { ProjectileConfig } from "./ProjectileConfig";

export default class Projectile {
    public sprite: MBAnimatedSprite;
    public velocity: Vec2;
    public alive: boolean = false;
    public config: ProjectileConfig;

    private gravity: number = 120; // light arc

    constructor(sprite: MBAnimatedSprite) {
        this.sprite = sprite;
        this.velocity = Vec2.ZERO;
        this.config = null!;
    }

    public fire(origin: Vec2, target: Vec2, config: ProjectileConfig): void {
        this.config = config;
        const dx = target.x - origin.x;
        const dy = target.y - origin.y;
        const len = Math.hypot(dx, dy);
        this.velocity = new Vec2(
            (dx / len) * config.speed,
            (dy / len) * config.speed
        );
        this.sprite.position.copy(origin);
        this.sprite.visible = true;
        this.sprite.animation.play(config.spriteAnim, true);
        this.alive = true;
    }

    public update(deltaT: number): void {
        if (!this.alive) return;

        this.velocity.x *= this.config.drag;
        this.velocity.y += this.gravity * deltaT;

        this.sprite.position.x += this.velocity.x * deltaT;
        this.sprite.position.y += this.velocity.y * deltaT;
    }

    public kill(): void {
        this.alive = false;
        this.sprite.visible = false;
    }
}