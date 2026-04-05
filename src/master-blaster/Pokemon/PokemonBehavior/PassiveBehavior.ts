import PokemonController from "../PokemonController";

export const PassiveStates ={
    FLEE : "FLEE"
} as const;

export default abstract class PassiveBehavior extends PokemonController {
    public onHit(damage: number): void {
        this.health -= damage;
        if (!this.isFainted){
            this.changeState(PassiveStates.FLEE);
        }
    }
}