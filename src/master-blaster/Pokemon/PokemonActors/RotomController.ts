import PokemonController, { PokemonStates } from "../PokemonController";
import MBAnimatedSprite from "../../Nodes/MBAnimatedSprite";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import RotomFollow from "../PokemonStates/RotomFollow";
import RotomOrbit from "../PokemonStates/RotomOrbit";
import Fainted from "../PokemonStates/Fainted";

export const RotomStates = {
    FOLLOW: "FOLLOW",
    ORBIT:  "ORBIT",
    FAINTED: "FAINTED",
} as const;

export const RotomAnimations = {
    IDLE:  "IDLE",   // swap these for whatever keys are in your spritesheet JSON
    FLOAT: "FLOAT",
} as const;

export default class RotomController extends PokemonController {

    // How close Rotom tries to hover next to the player
    public readonly FOLLOW_DIST  = 32;
    // How fast it considers the player "still" (pixels/sec threshold)
    public readonly STILL_THRESH = 8;

    protected addStates(): void {
        this.addState(RotomStates.FOLLOW,  new RotomFollow(this, this.owner));
        this.addState(RotomStates.ORBIT,   new RotomOrbit(this, this.owner));
        this.addState(RotomStates.FAINTED, new Fainted(this, this.owner));
        this.speed      = 90;
        this.maxHealth  = 999;
        this._health    = 999; // set directly, skip event
    }

    // Override to avoid polluting the player health bar
    public set health(v: number) { this._health = v; }
    public get health(): number  { return this._health; }

    public onHit(_damage: number): void { /* companion - ignore hits */ }

    public initialize(startState: string): void {
        super.initialize(RotomStates.FOLLOW);
    }
}