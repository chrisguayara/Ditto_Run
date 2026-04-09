// PhantumpController.ts
import HostileBehavior, {HostileStates} from "../PokemonBehavior/HostileBehavior";
import { PokemonStates } from "../PokemonController";
import Patrol from "../PokemonStates/Patrol";
import Fainted from "../PokemonStates/Fainted";
import Flee from "../PokemonStates/Flee";
import Attack from "../PokemonStates/Attack";
export default class PhantumpController extends HostileBehavior {
    protected addStates(): void {
    this.addState(PokemonStates.PATROL, new Patrol(this, this.owner));
    this.addState(PokemonStates.FAINTED, new Fainted(this, this.owner));
    this.addState(PokemonStates.FLEE, new Flee(this, this.owner));
    this.addState(HostileStates.ATTACK, new Attack(this, this.owner));

        this.speed = 90;
        this.maxHealth = 4;
        this.health = this.maxHealth;
    }
}