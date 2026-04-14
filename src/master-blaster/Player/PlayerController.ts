import StateMachineAI from "../../Wolfie2D/AI/StateMachineAI";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import OrthogonalTilemap from "../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";

import Fall from "./PlayerStates/Fall";
import Idle from "./PlayerStates/Idle";
import Jump from "./PlayerStates/Jump";
import Run from "./PlayerStates/Run";
import Dead from "./PlayerStates/Dead";

import PlayerWeapon from "./PlayerWeapon";
import Input from "../../Wolfie2D/Input/Input";
import TransformationManager from "./TransformationManager";

import { MBControls } from "../MBControls";
import MBAnimatedSprite from "../Nodes/MBAnimatedSprite";
import MathUtils from "../../Wolfie2D/Utils/MathUtils";
import { MBEvents } from "../MBEvents";
import MBLevel from "../Scenes/MBLevel";

export const PlayerAnimations = {
    IDLE: "IDLE",
    WALK: "WALK",
    JUMP: "JUMP",
    FALL: "FALL",   
    ROWLET_IDLE: "ROWLET_IDLE",
    ROWLET_FLY: "ROWLET_FLY",
    PHANTUMP_FLY: "PHANTUMP_FLY",
    PHANTUMP_IDLE: "PHANTUMP_IDLE",
    TRANSFORMATION: "TRANSFORMATION",
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
    TRANSFORMATION: "TRANSFORMATION"
} as const

export default class PlayerController extends StateMachineAI {
    public readonly MAX_SPEED: number = 200;
    public readonly MIN_SPEED: number = 100;
    public readonly BASE_JUMP_FORCE: number = -200;
    public readonly BASE_GRAVITY: number = 500;
    private _sludgeTimer: number = 0;
    private _transforming: boolean = false;
    private _transformTimer: number = 0;
    public readonly SLUDGE_COOLDOWN: number = 1;
    private readonly TRANSFORM_ANIM_DURATION: number = 0.43;

    protected _health!: number;
    protected _maxHealth!: number;
    protected owner!: MBAnimatedSprite;
    protected _velocity!: Vec2;
    protected _speed!: number;
    protected tilemap!: OrthogonalTilemap;
    protected weapon!: PlayerWeapon;
    protected _transformations!: TransformationManager;

    public initializeAI(owner: MBAnimatedSprite, options: Record<string, any>): void {
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
            this.owner.animation.play(PlayerAnimations.TRANSFORMATION, false);
            this._transforming = true;
            this._transformTimer = this.TRANSFORM_ANIM_DURATION;
        }
        if (this._transforming) {
            this._transformTimer -= deltaT;
            if (this._transformTimer <= 0) {
                this._transforming = false;
            }
        }
        // Phantump weapon rotation (mouse-aimed, unchanged)
        this.weapon.rotation = 2*Math.PI - Vec2.UP.angleToCCW(this.faceDir) + Math.PI;
        if (Input.isPressed(MBControls.ATTACK) && !this.weapon.isSystemRunning()) {
            this.weapon.rotation = 2*Math.PI - Vec2.UP.angleToCCW(this.faceDir) + Math.PI;
            this.weapon.startSystem(500, 0, this.owner.position);
        }

        // Sludge uses arrow keys, blocked in Rowlet form
        if (this._sludgeTimer > 0) {
            this._sludgeTimer -= deltaT;
        }
        if (Input.isJustPressed(MBControls.CYCLE_FORM)) {
            this._transformations.cycleNext();
            const selected = this._transformations.selectedForm;
            if (selected) {
                this.emitter.fireEvent(MBEvents.FORM_SELECTED, { displayName: selected.displayName });
            }
        }
        const activeForm = this._transformations.activeForm?.key ?? null;
        if (activeForm !== "ROWLET" && this._sludgeTimer <= 0) {
            const dx = (Input.isPressed(MBControls.ATTACK_RIGHT) ? 1 : 0)
                    - (Input.isPressed(MBControls.ATTACK_LEFT)  ? 1 : 0);
            const dy = (Input.isPressed(MBControls.ATTACK_DOWN)  ? 1 : 0)
                    - (Input.isPressed(MBControls.ATTACK_UP)    ? 1 : 0);

            if (dx !== 0 || dy !== 0) {
                const dir = new Vec2(dx, dy).normalize();
                (this.owner.getScene() as MBLevel).fireSludge(
                    this.owner.position.clone(), dir
                );
                this._sludgeTimer = this.SLUDGE_COOLDOWN;
            }
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
    public get isTransforming(): boolean { return this._transforming; }

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

    public getAnimationKey(base: "IDLE" | "WALK" | "JUMP" | "FALL"): string {
        const form = this._transformations.activeForm?.key ?? null;

        if (form === "ROWLET") {
            return (base === "JUMP" || base === "FALL") 
                ? PlayerAnimations.ROWLET_FLY 
                : PlayerAnimations.ROWLET_IDLE;
        }
        if (form === "PHANTUMP") {
            return base === "IDLE" 
                ? PlayerAnimations.PHANTUMP_IDLE 
                : PlayerAnimations.PHANTUMP_FLY;
        }
        return PlayerAnimations[base];
    }
    
}