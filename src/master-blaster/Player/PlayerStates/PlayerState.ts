import State from "../../../Wolfie2D/DataTypes/State/State";
import GameEvent from "../../../Wolfie2D/Events/GameEvent";
import MBAnimatedSprite from "../../Nodes/MBAnimatedSprite";
import PlayerController from "../PlayerController";

export default abstract class PlayerState extends State {

    protected parent!: PlayerController;
    protected owner!: MBAnimatedSprite;
    // gravity field removed, using this.parent.effectiveGravity in subclasses instead

	public constructor(parent: PlayerController, owner: MBAnimatedSprite){
		super(parent);
		this.owner = owner;
	}

    public abstract onEnter(options: Record<string, any>): void;

	public handleInput(event: GameEvent): void {
        switch(event.type) {
            default: {
                throw new Error(`Unhandled event in PlayerState of type ${event.type}`);
            }
        }
	}

	public update(deltaT: number): void {
        // this.owner.invertX=this.parent.inputDir.x<0;
    }

    public abstract onExit(): Record<string, any>;
}