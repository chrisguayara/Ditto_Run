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

        // Flip direction at patrol boundaries
        if (this.owner.position.x >= this.parent.patrolRight) {
            this.movingRight = false;
        } else if (this.owner.position.x <= this.parent.patrolLeft) {
            this.movingRight = true;
        }

        this.parent.velocity.x = this.movingRight ? this.parent.speed : -this.parent.speed;
        this.parent.velocity.y += this.gravity * deltaT;
        this.owner.move(this.parent.velocity.scaled(deltaT));

        // Hostile mobs get an aggro check here — passive/neutral don't
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