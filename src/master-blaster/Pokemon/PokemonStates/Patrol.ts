import PokemonState from "./PokemonState";
import PokemonController from "../PokemonController";
import MBAnimatedSprite from "../../Nodes/MBAnimatedSprite";

export default class Patrol extends PokemonState {

    constructor(parent: PokemonController, owner: MBAnimatedSprite) {
        super(parent, owner);
    }

    public onEnter(options: Record<string, any>): void {}

    public update(deltaT: number): void {
        // patrol logic
    }

    public onExit(): Record<string, any> {
        return {};
    }
}