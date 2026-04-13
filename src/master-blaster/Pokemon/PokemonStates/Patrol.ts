// Patrol.ts
import PokemonState from "./PokemonState";
import { PokemonStates, PokemonAnimations } from "../PokemonController";
import { HostileStates } from "../PokemonBehavior/HostileBehavior";
import HostileBehavior from "../PokemonBehavior/HostileBehavior";
import MBAnimatedSprite from "../../Nodes/MBAnimatedSprite";
import PokemonController from "../PokemonController";

export default class Patrol extends PokemonState {

    private movingRight: boolean = true;

    public constructor(parent: PokemonController, owner: MBAnimatedSprite) {
        super(parent, owner);
    }

    public onEnter(options: Record<string, any>): void {
        this.owner.animation.play(PokemonAnimations.WALK, true);
        this.movingRight = true;
    }

    public update(deltaT: number): void {
        super.update(deltaT);

        this.parent.velocity.x = this.movingRight ? this.parent.speed : -this.parent.speed;
        this.parent.velocity.y += this.gravity * deltaT;

        // Store x before move to detect if we were stopped by a wall
        const prevX = this.owner.position.x;
        this.owner.move(this.parent.velocity.scaled(deltaT));

        // If we barely moved horizontally, we hit a wall — reverse
        const movedX = Math.abs(this.owner.position.x - prevX);
        if (movedX < 0.5) {
            this.movingRight = !this.movingRight;
        }

        // Also keep the boundary fallback so it doesn't wander forever
        if (this.owner.position.x >= this.parent.patrolRight) this.movingRight = false;
        if (this.owner.position.x <= this.parent.patrolLeft) this.movingRight = true;

        // Flip sprite to face direction
        this.owner.invertX = !this.movingRight;

        if (this.parent instanceof HostileBehavior) {
            const dist = this.owner.position.distanceTo(this.parent.playerRef.position);
            if (dist <= this.parent.AGGRO_RANGE) {
                this.finished(HostileStates.ATTACK);
            }
        }
    }

    public onExit(): Record<string, any> {
        this.parent.velocity.x = 0;
        this.owner.animation.stop();
        return {};
    }
}