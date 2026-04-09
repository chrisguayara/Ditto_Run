import PokemonState from "./PokemonState";
import { PokemonStates, PokemonAnimations } from "../PokemonController";
import HostileBehavior from "../PokemonBehavior/HostileBehavior";
import MBAnimatedSprite from "../../Nodes/MBAnimatedSprite";
import PokemonController from "../PokemonController";

export default class Attack extends PokemonState {

    public onEnter(options: Record<string, any>): void {
        this.owner.animation.play(PokemonAnimations.WALK, true); // Set to walk for now, swap for attack anim
    }

    public update(deltaT: number): void {
        super.update(deltaT);

        if (this.parent instanceof HostileBehavior) {
            const dist = this.owner.position.distanceTo(this.parent.playerRef.position);
            // If player moves out of aggro range, go back to patrol
            if (dist > this.parent.AGGRO_RANGE) {
                this.finished(PokemonStates.PATROL);
            }
            // TODO: deal damage to player
        }
    }

    public onExit(): Record<string, any> {
        return {};
    }
}