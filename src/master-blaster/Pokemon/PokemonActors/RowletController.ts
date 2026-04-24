import PassiveBehavior from "../PokemonBehavior/PassiveBehavior";
import { PokemonStates } from "../PokemonController";
import Patrol from "../PokemonStates/Patrol";
import Fainted from "../PokemonStates/Fainted";
import RowletFlee from "../PokemonStates/RowletFlee";

export default class RowletController extends PassiveBehavior {
    protected addStates(): void {
        // Rowlet floats — 30 % of standard gravity
        this.gravityMultiplier = 0.3;

        this.speed      = 70;
        this.maxHealth  = 4;
        this.health     = this.maxHealth;

        this.addState(PokemonStates.PATROL,  new Patrol(this, this.owner));
        this.addState(PokemonStates.FAINTED, new Fainted(this, this.owner));
        this.addState(PokemonStates.FLEE,    new RowletFlee(this, this.owner));
    }
}