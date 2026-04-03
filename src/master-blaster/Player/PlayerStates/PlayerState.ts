import State from "../../../Wolfie2D/DataTypes/State/State";
import GameEvent from "../../../Wolfie2D/Events/GameEvent";
import MathUtils from "../../../Wolfie2D/Utils/MathUtils";
import MBAnimatedSprite from "../../Nodes/MBAnimatedSprite";
import PlayerController from "../PlayerController";

/**
 * An abstract state for the PlayerController 
 */
export default abstract class PlayerState extends State {

    protected parent: PlayerController;
	protected owner: MBAnimatedSprite;
	protected gravity: number;

	public constructor(parent: PlayerController, owner: MBAnimatedSprite){
		super(parent);
		this.owner = owner;
        this.gravity = 500;
	}

    public abstract onEnter(options: Record<string, any>): void;

    /**
     * Handle game events from the parent.
     * @param event the game event
     */
	public handleInput(event: GameEvent): void {
        switch(event.type) {
            // Default - throw an error
            default: {
                throw new Error(`Unhandled event in PlayerState of type ${event.type}`);
            }
        }
	}

	public update(deltaT: number): void {

    }

    public abstract onExit(): Record<string, any>;
}