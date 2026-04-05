import PokemonController from "../PokemonController";

export const NeutralStates ={
    ATTACK : "ATTACK"
} as const;

export default abstract class NeutralBehavior extends PokemonController {
    public onHit(damage: number): void {
        this.health -= damage;
        if (!this.isFainted){
            this.changeState(NeutralStates.ATTACK);
        }
    }
}