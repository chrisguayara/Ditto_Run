// Fainted.ts
import PokemonState from "./PokemonState";
import { PokemonAnimations } from "../PokemonController";

export default class Fainted extends PokemonState {

    public onEnter(options: Record<string, any>): void {
        this.owner.animation.play(PokemonAnimations.FAINTED, false);
        this.parent.velocity.x = 0;
        this.parent.velocity.y = 0;
        // isFainted is now true — Ditto can transform
    }

    public update(deltaT: number): void {}

    public onExit(): Record<string, any> { return {}; }
}