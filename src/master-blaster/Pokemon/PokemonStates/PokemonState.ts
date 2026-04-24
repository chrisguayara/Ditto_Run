import State from "../../../Wolfie2D/DataTypes/State/State";
import GameEvent from "../../../Wolfie2D/Events/GameEvent";
import MBAnimatedSprite from "../../Nodes/MBAnimatedSprite";
import PokemonController from "../PokemonController";

export default abstract class PokemonState extends State {

    protected parent: PokemonController;
    protected owner: MBAnimatedSprite;

    /** Always use this instead of a hardcoded 500 — respects per-species gravity */
    protected get gravity(): number { return this.parent.effectiveGravity; }

    public constructor(parent: PokemonController, owner: MBAnimatedSprite) {
        super(parent);
        this.parent = parent;
        this.owner = owner;
    }

    public abstract onEnter(options: Record<string, any>): void;

    public handleInput(event: GameEvent): void {
        switch (event.type) {
            default:
                throw new Error(`Unhandled event in PokemonState: ${event.type}`);
        }
    }

    public update(deltaT: number): void {}

    public abstract onExit(): Record<string, any>;
}