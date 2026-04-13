import PokemonState from "./PokemonState";
import { PokemonStates, PokemonAnimations } from "../PokemonController";
import HostileBehavior from "../PokemonBehavior/HostileBehavior";
import MBAnimatedSprite from "../../Nodes/MBAnimatedSprite";
import PokemonController from "../PokemonController";
import { MBEvents } from "../../MBEvents";
import StateMachine from "../../../Wolfie2D/DataTypes/State/StateMachine";

export default class Attack extends PokemonState {

    private readonly ATTACK_SPEED = 100;
    private readonly DAMAGE_COOLDOWN = 1.0; 
    private damageCooldown: number = 0;

    public onEnter(options: Record<string, any>): void {
        this.owner.animation.play(PokemonAnimations.WALK, true); // Set to walk for now, swap for attack anim
    }

    public update(deltaT: number): void {
        super.update(deltaT);
        this.damageCooldown -= deltaT;

        if (this.parent instanceof HostileBehavior) {
            const player = this.parent.playerRef;
            const dist = this.owner.position.distanceTo(player.position);

            if (dist > this.parent.AGGRO_RANGE) {
                this.finished(PokemonStates.PATROL);
                return;
            }

            // Move toward player
            const dir = player.position.clone().sub(this.owner.position).normalize();
            this.parent.velocity.x = dir.x * this.ATTACK_SPEED;
            this.parent.velocity.y += this.gravity * deltaT;
            this.owner.move(this.parent.velocity.scaled(deltaT));

            // Flip sprite to face player
            this.owner.invertX = dir.x < 0;

            // Deal damage when close enough and cooldown is up
            const MELEE_RANGE = 12;
            if (dist <= MELEE_RANGE && this.damageCooldown <= 0) {
                this.damageCooldown = this.DAMAGE_COOLDOWN;
                this.parent.emitter.fireEvent(MBEvents.PLAYER_TAKE_DAMAGE, { damage: 1 });
            }
        }
    }

    public onExit(): Record<string, any> {
        return {};
    }
}