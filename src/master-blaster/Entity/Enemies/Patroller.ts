// src/mb/Entity/Enemies/Patroller.ts
import Enemy from "../Entity/Enemy";
import MBAnimatedSprite from "../Nodes/MBAnimatedSprite";

export default class Patroller extends Enemy {
    private patrolLeft: number;
    private patrolRight: number;
    private speed: number;
    private direction: number = 1;

    constructor(
        sprite: MBAnimatedSprite,
        patrolLeft: number,
        patrolRight: number,
        speed: number = 60,
        maxHealth: number = 2,
        contactDamage: number = 1
    ) {
        super(sprite, maxHealth, contactDamage);
        this.patrolLeft = patrolLeft;
        this.patrolRight = patrolRight;
        this.speed = speed;
    }

    public update(deltaT: number): void {
        super.update(deltaT); // handles faint check + hit flash

        this.sprite.position.x += this.direction * this.speed * deltaT;
        this.sprite.invertX = this.direction < 0;

        if (this.sprite.position.x >= this.patrolRight) this.direction = -1;
        else if (this.sprite.position.x <= this.patrolLeft) this.direction = 1;

        this.sprite.animation.playIfNotAlready("WALK", true);
    }

    protected onFaint(): void {
        this.sprite.animation.play("FAINT", false);
        setTimeout(() => { this.sprite.visible = false; }, 500);
    }
}