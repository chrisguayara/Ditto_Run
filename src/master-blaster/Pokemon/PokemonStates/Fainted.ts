// Fainted.ts
import PokemonState from "./PokemonState";
import { PokemonAnimations } from "../PokemonController";

export default class Fainted extends PokemonState {
    protected looping = false;

    public onEnter(options: Record<string, any>): void {
        this.owner.animation.play(PokemonAnimations.DEAD, true);
        this.parent.velocity.x = 0;
        this.parent.velocity.y = 0;

        console.log("This pokemon is now fainted, tranforming is allowed")
        
    }
    

    public update(deltaT: number): void {
        if (!this.owner.animation.isPlaying(PokemonAnimations.DEAD) && (!this.looping)) {
            this.owner.animation.playIfNotAlready(PokemonAnimations.DEADCONT)
            this.looping = true;

        }
    }

    public onExit(): Record<string, any> { return {}; }
}