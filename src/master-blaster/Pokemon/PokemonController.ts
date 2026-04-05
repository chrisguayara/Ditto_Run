import StateMachineAI from "../../Wolfie2D/AI/StateMachineAI";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import MBAnimatedSprite from "../Nodes/MBAnimatedSprite";
import MathUtils from "../../Wolfie2D/Utils/MathUtils";
import { MBEvents } from "../MBEvents";



export const PokemonAnimations = {
    WALK: "WALK",
    ATTACK: "ATTACK",
    FAINTED: "FAINTED"
} as const;

export const PokemonStates = {
    PATROL: "PATROL",
    FAINTED: "FAINTED"
} as const

export default abstract class PokemonController extends StateMachineAI {
    protected owner: MBAnimatedSprite;
    protected health: number;
    protected maxHealth: number;
    protected velocity: Vec2;
    protected speed!: number;

    public playerRef: MBAnimatedSprite;

    public patrolLeft: number = 0;
    public patrolRight: number = 100;

    initializeAI(owner: MBAnimatedSprite, options: Record<string, any>): void {
        this.owner = owner;
        this.patrolLeft = options.patrolLeft ?? owner.position.x - 100;
        this.patrolRight = options.patrolRight ?? owner.position.x + 100;

        this.speed = options.speed ?? 60;
        this.maxHealth = options.maxHealth ?? 5;
        this.health = this.maxHealth;
        this.velocity = Vec2.ZERO;

        this.addStates();
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

    public get isFainted(): boolean { return this.health === 0; }

    public get velocity(): Vec2 { return this.velocity; }
    public set velocity(v: Vec2) { this.velocity = v; }

    public get speed(): number { return this.speed; }
    public set speed(s: number) { this.speed = s; }

    public get maxHealth(): number { return this.maxHealth; }
    public set maxHealth(v: number) { this.maxHealth = v; }

    public get health(): number { return this.health; }
    public set health(v: number) {
        this.health = MathUtils.clamp(v, 0, this.maxHealth);
        this.emitter.fireEvent(MBEvents.HEALTH_CHANGE, {
            curhp: this.health,
            maxhp: this.maxHealth,
        });
        if (this.health <= 0) {
            this.changeState(PokemonStates.FAINTED);
        }
    }
}


        