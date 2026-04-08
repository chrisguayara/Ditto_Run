// RowletController.ts
import PassiveBehavior, {PassiveStates} from "../PokemonBehavior/PassiveBehavior";
import { PokemonStates } from "../PokemonController";
import Patrol from "../PokemonStates/Patrol";
import Fainted from "../PokemonStates/Fainted";
import Flee from "../PokemonStates/Flee";

export default class RowletController extends PassiveBehavior {
    protected addStates(): void {
        

        this.addState(PokemonStates.PATROL, new Patrol(this,this.owner));
        this.addState(PokemonStates.FAINTED, new Fainted(this, this.owner));
        this.addState(PokemonStates.FLEE,new Flee(this, this.owner) );

        this.speed = 60;
        this.maxHealth = 4;
        this.health = this.maxHealth;
    }
}