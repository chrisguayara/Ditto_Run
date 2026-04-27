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
    IDLE:  "IDLE",
    FLOAT: "FLOAT",
} as const;

export default class RotomController extends PokemonController {

    public readonly FOLLOW_DIST  = 32;
    public readonly STILL_THRESH = 8;

    private _playerRef!: MBAnimatedSprite;

    protected addStates(): void {
        this.addState(RotomStates.FOLLOW,  new RotomFollow(this, this.owner));
        this.addState(RotomStates.ORBIT,   new RotomOrbit(this, this.owner));
        this.addState(RotomStates.FAINTED, new Fainted(this, this.owner));
        this.speed      = 90;
        this.maxHealth  = 999;
        this._health    = 999;
    }

    public initializeAI(owner: MBAnimatedSprite, options: Record<string, any>): void {
        super.initializeAI(owner, options);
        this._playerRef = options.playerRef;
    }

    public update(deltaT: number): void {
        super.update(deltaT);

        if (!this._playerRef) return;

        const playerVelY = (this._playerRef._velocity as Vec2)?.y ?? 0;
        const playerIsBelow = this._playerRef.position.y > this.owner.position.y;

        // Phase through when player is below Rotom and moving upward
        const shouldPhase = playerIsBelow && playerVelY < 0;

        if (shouldPhase) {
            this.owner.disablePhysics();
        } else {
            this.owner.enablePhysics();
        }
    }

    public set health(v: number) { this._health = v; }
    public get health(): number  { return this._health; }

    public onHit(_damage: number): void { /* companion - ignore hits */ }

    public initialize(startState: string): void {
        super.initialize(RotomStates.FOLLOW);
        this.contactDamage = 0;
    }
}