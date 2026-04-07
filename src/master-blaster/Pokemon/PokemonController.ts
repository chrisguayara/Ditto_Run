import StateMachineAI from "../../Wolfie2D/AI/StateMachineAI";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import MBAnimatedSprite from "../Nodes/MBAnimatedSprite";
import MathUtils from "../../Wolfie2D/Utils/MathUtils";
import { MBEvents } from "../MBEvents";



export const PokemonAnimations = {
    WALK: "WALK",
    ATTACK: "ATTACK",
    FAINTED: "DEAD"
} as const;

export const PokemonStates = {
    PATROL: "PATROL",
    FAINTED: "FAINTED",
    FLEE : "FLEE"
} as const

export default abstract class PokemonController extends StateMachineAI {
    protected owner: MBAnimatedSprite;
    protected _health: number;
    protected _maxHealth: number;
    protected _velocity: Vec2;
    protected _speed!: number;

    public playerRef: MBAnimatedSprite;

    public patrolLeft: number = 0;
    public patrolRight: number = 100;

    // PokemonController.ts — initializeAI
    public initializeAI(owner: MBAnimatedSprite, options: Record<string, any>): void {
        this.owner = owner;
        this.playerRef = options.playerRef;
        this.patrolLeft  = options.patrolLeft  ?? owner.position.x - 100;
        this.patrolRight = options.patrolRight ?? owner.position.x + 100;
        this.speed       = options.speed       ?? 60;
        this.maxHealth   = options.maxHealth   ?? 5;
        this.health      = this.maxHealth;      // always full health on spawn
        this.velocity    = Vec2.ZERO;

        this.addStates();                        // concrete class registers its states
        this.initialize(PokemonStates.PATROL);
    }
    protected abstract addStates(): void;

    

    /**
     * Called by the scene (or a weapon collision) when this pokemon takes damage.
     * Each behavior subclass reacts differently.
     */
    public abstract onHit(damage: number): void;

    public update(deltaT: number): void {
        super.update(deltaT);
    }

    public get isFainted(): boolean { return this._health === 0; }

    public get velocity(): Vec2 { return this._velocity; }
    public set velocity(v: Vec2) { this._velocity = v; }

    public get speed(): number { return this._speed; }
    public set speed(s: number) { this._speed = s; }

    public get maxHealth(): number { return this._maxHealth; }
    public set maxHealth(v: number) { this._maxHealth = v; }

    public get health(): number { return this._health; }
    public set health(v: number) {
        this._health = MathUtils.clamp(v, 0, this.maxHealth);
        this.emitter.fireEvent(MBEvents.HEALTH_CHANGE, {
            curhp: this._health,
            maxhp: this._maxHealth,
        });
        if (this._health <= 0) {
            this.changeState(PokemonStates.FAINTED);
        }
    }
}


        