import PokemonController from "../PokemonController";

export const HostileStates ={
    ATTACK : "ATTACK"
} as const;

export default abstract class HostileBehavior extends PokemonController {
    public readonly AGGRO_RANGE: number = 100;
    public onHit(damage: number): void {
        this.health -= damage;
    }
}