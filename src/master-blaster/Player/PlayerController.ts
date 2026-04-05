import StateMachineAI from "../../Wolfie2D/AI/StateMachineAI";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import OrthogonalTilemap from "../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";

import Fall from "./PlayerStates/Fall";
import Idle from "./PlayerStates/Idle";
import Jump from "./PlayerStates/Jump";
import Run from "./PlayerStates/Run";

import PlayerWeapon from "./PlayerWeapon";
import Input from "../../Wolfie2D/Input/Input";

import { MBControls } from "../MBControls";
import MBAnimatedSprite from "../Nodes/MBAnimatedSprite";
import MathUtils from "../../Wolfie2D/Utils/MathUtils";
import { MBEvents } from "../MBEvents";
import Dead from "./PlayerStates/Dead";
import TransformationManager from "./TransformationManager";

export const PlayerAnimations = {
    IDLE: "IDLE",
    WALK: "WALK",
    JUMP: "JUMP",
} as const

export const PlayerTweens = {
    FLIP: "FLIP",
    DEATH: "DEATH"
} as const

export const PlayerStates = {
    IDLE: "IDLE",
    RUN: "RUN",
    JUMP: "JUMP",
    FALL: "FALL",
    DEAD: "DEAD",
} as const

export default class PlayerController extends StateMachineAI {
    public readonly MAX_SPEED: number = 200;
    public readonly MIN_SPEED: number = 100;
    public readonly BASE_JUMP_FORCE: number = -200;
    public readonly BASE_GRAVITY: number = 500;

    protected _health!: number;
    protected _maxHealth!: number;
    protected _transformations!: TransformationManager;
    protected owner!: MBAnimatedSprite;
    protected _velocity!: Vec2;
    protected _speed!: number;
    protected tilemap!: OrthogonalTilemap;
    protected weapon!: PlayerWeapon;

    public initializeAI(owner: MBAnimatedSprite, options: Record<string, any>){
        this.owner = owner;
        this.weapon = options.weaponSystem;
        this._transformations = new TransformationManager();
        this.tilemap = this.owner.getScene().getTilemap(options.tilemap) as OrthogonalTilemap;
        
        this.speed = 400;
        this.velocity = Vec2.ZERO;
        this.health = 10;
        this.maxHealth = 10;

        this.addState(PlayerStates.IDLE, new Idle(this, this.owner));
        this.addState(PlayerStates.RUN, new Run(this, this.owner));
        this.addState(PlayerStates.JUMP, new Jump(this, this.owner));
        this.addState(PlayerStates.FALL, new Fall(this, this.owner));
        this.addState(PlayerStates.DEAD, new Dead(this, this.owner));
        
        this.initialize(PlayerStates.IDLE);
    }

    public get inputDir(): Vec2 {
        let direction = Vec2.ZERO;
        direction.x = (Input.isPressed(MBControls.MOVE_LEFT) ? -1 : 0) + (Input.isPressed(MBControls.MOVE_RIGHT) ? 1 : 0);
        direction.y = (Input.isJustPressed(MBControls.JUMP) ? -1 : 0);
        return direction;
    }

    public get faceDir(): Vec2 { return this.owner.position.dirTo(Input.getGlobalMousePosition()); }

    public update(deltaT: number): void {
        super.update(deltaT);

        this._transformations.update(deltaT);

        if (Input.isJustPressed(MBControls.TRANSFORM)) {
            this._transformations.toggle();
        }
        if (Input.isJustPressed(MBControls.CYCLE_FORM)) {
            this._transformations.cycleNext();
        }

        this.weapon.rotation = 2*Math.PI - Vec2.UP.angleToCCW(this.faceDir) + Math.PI;

        if (Input.isPressed(MBControls.ATTACK) && !this.weapon.isSystemRunning()) {
            this.weapon.rotation = 2*Math.PI - Vec2.UP.angleToCCW(this.faceDir) + Math.PI;
            this.weapon.startSystem(500, 0, this.owner.position);
        }
    }

    // ── Transformation passthrough ────────────────────────────────
    public get transformations(): TransformationManager { return this._transformations; }

    public get effectiveSpeed(): number {
        return this._speed * this._transformations.speedMultiplier;
    }
    public get effectiveGravity(): number {
        return this.BASE_GRAVITY * this._transformations.gravityMultiplier;
    }
    public get effectiveJumpForce(): number {
        return this._transformations.jumpForce ?? this.BASE_JUMP_FORCE;
    }

    // ── Standard getters/setters ──────────────────────────────────
    public get velocity(): Vec2 { return this._velocity; }
    public set velocity(velocity: Vec2) { this._velocity = velocity; }

    public get speed(): number { return this._speed; }
    public set speed(speed: number) { this._speed = speed; }

    public get maxHealth(): number { return this._maxHealth; }
    public set maxHealth(maxHealth: number) { this._maxHealth = maxHealth; }

    public get health(): number { return this._health; }
    public set health(health: number) {
        this._health = MathUtils.clamp(health, 0, this.maxHealth);
        this.emitter.fireEvent(MBEvents.HEALTH_CHANGE, {curhp: this.health, maxhp: this.maxHealth});
        if (this.health === 0) { this.changeState(PlayerStates.DEAD); }
    }
}