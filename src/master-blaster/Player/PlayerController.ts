import StateMachineAI from "../../Wolfie2D/AI/StateMachineAI";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import OrthogonalTilemap from "../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import { GameEventType } from "../../Wolfie2D/Events/GameEventType";
import Fall from "./PlayerStates/Fall";
import Idle from "./PlayerStates/Idle";
import Jump from "./PlayerStates/Jump";
import Run from "./PlayerStates/Run";
import Dead from "./PlayerStates/Dead";
import PlayerState from "./PlayerStates/PlayerState";
import PlayerWeapon from "./PlayerWeapon";
import Input from "../../Wolfie2D/Input/Input";
import TransformationManager from "./TransformationManager";
import WallSlide             from "./PlayerStates/WallSlide";
import GreninjaTongueGrapple from "./PlayerStates/GreninjaTongueGrapple";
import { MBControls } from "../MBControls";
import MBAnimatedSprite from "../Nodes/MBAnimatedSprite";
import MathUtils from "../../Wolfie2D/Utils/MathUtils";
import { MBEvents } from "../MBEvents";
import MBLevel from "../Scenes/MBLevel";
import Scene from "../../Wolfie2D/Scene/Scene";
import BlitzState from "./PlayerStates/BlitzState";
import GlideState from "./PlayerStates/GlideState";

export const PlayerAnimations = {
    IDLE: "IDLE",
    WALK: "WALK",
    JUMP: "JUMP",
    FALL: "FALL",   
    // ROWLET_IDLE: "ROWLET_IDLE",
    // ROWLET_FLY: "ROWLET_FLY",
    // PHANTUMP_FLY: "PHANTUMP_FLY",
    // PHANTUMP_IDLE: "PHANTUMP_IDLE",
    TRANSFORMATION : "TRANSFORMATION",
    GRENINJA_IDLE:       "GRENINJA_IDLE",
    GRENINJA_WALK:        "GRENINJA_WALK",
    GRENINJA_JUMP:       "GRENINJA_JUMP",
    GRENINJA_FALL:       "GRENINJA_FALL",
    GRENINJA_WALL_SLIDE: "GRENINJA_WALL_SLIDE",
    GRENINJA_GRAPPLE:    "GRENINJA_GRAPPLE",
    CHARIZARD_IDLE: "CHARIZARD_IDLE",
    CHARIZARD_BLITZ : "CHARIZARD_BLITZ"
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
    TRANSFORMATION: "TRANSFORMATION",
    WALL_SLIDE: "WALL_SLIDE",      
    GLIDE: "GLIDE",
    GRAPPLE:    "GRAPPLE",   
    BLITZ: "BLITZ"
} as const

export default class PlayerController extends StateMachineAI {
    public grappleCooldown: number = 0;
    public blitzCooldown:   number = 0;
    public readonly GRAPPLE_COOLDOWN_TIME: number = 3.0;
    public readonly BLITZ_COOLDOWN_TIME:   number = 3.0;
    public readonly MAX_SPEED: number = 300;
    public readonly MIN_SPEED: number = 130;
    public readonly BASE_JUMP_FORCE: number = -200;
    public readonly BASE_GRAVITY: number = 500;
    private _sludgeTimer: number = 0;
    private _transforming: boolean = false;
    private _transformTimer: number = 0;
    public readonly SLUDGE_COOLDOWN: number = 1;
    private readonly TRANSFORM_ANIM_DURATION: number = 0.43;
    public isPaused: boolean = false;
    /** Set by GreninjaTongueGrapple; null when not grappling. Use for line rendering. */
    public grappleAnchor: Vec2 | null = null;
    /** Current tongue-tip position while casting; null when not grappling. */
    public grappleTip:   Vec2 | null  = null;
    protected _health!: number;
    protected _maxHealth!: number;
    protected owner!: MBAnimatedSprite;
    protected _velocity!: Vec2;
    protected _speed!: number;
    protected _tilemap!: OrthogonalTilemap;
    protected weapon!: PlayerWeapon;
    protected _transformations!: TransformationManager;
    public scene! : MBLevel;

    public damageCooldown: number = 0; // ms
    public readonly DAMAGE_COOLDOWN_TIME = 500; // half a second

    public initializeAI(owner: MBAnimatedSprite, options: Record<string, any>): void {
        this.owner = owner;
        this.weapon = options.weaponSystem;
        this._transformations = new TransformationManager();
    
        this._tilemap = this.owner.getScene().getTilemap(options.tilemap) as OrthogonalTilemap;
        this.speed = 400;
        this.velocity = Vec2.ZERO;
        this.health = 3;
        this.maxHealth = 3;
        this.damageCooldown = 0; // ensure clean state
    
        // Always start as Greninja, Charizard available via toggle
        this._transformations.unlockForm("GRENINJA");
        this._transformations.unlockForm("CHARIZARD");
        this._transformations.forceActivate("GRENINJA");
    
        this.addState(PlayerStates.IDLE, new Idle(this, this.owner));
        this.addState(PlayerStates.RUN, new Run(this, this.owner));
        this.addState(PlayerStates.JUMP, new Jump(this, this.owner));
        this.addState(PlayerStates.FALL, new Fall(this, this.owner));
        this.addState(PlayerStates.DEAD, new Dead(this, this.owner));
        this.addState(PlayerStates.WALL_SLIDE, new WallSlide(this, this.owner));
        this.addState(PlayerStates.GRAPPLE, new GreninjaTongueGrapple(this, this.owner));
        this.addState(PlayerStates.BLITZ, new BlitzState(this, this.owner));
        this.addState(PlayerStates.GLIDE, new GlideState(this, this.owner));
        this.initialize(PlayerStates.IDLE);
        this.scene = this.owner.getScene();
    }

    public get inputDir(): Vec2 {
        let direction = Vec2.ZERO;
        direction.x = (Input.isPressed(MBControls.MOVE_LEFT) ? -1 : 0) + (Input.isPressed(MBControls.MOVE_RIGHT) ? 1 : 0);
        direction.y = (Input.isJustPressed(MBControls.JUMP) ? -1 : 0);
        return direction;
    }

    public get faceDir(): Vec2 { return this.owner.position.dirTo(Input.getGlobalMousePosition()); }
    /**
     * Returns which wall the player is currently touching:
     *  -1 = left wall,  1 = right wall,  0 = no wall
     *
     * Primary: uses physics-set onLeft / onRight if the engine provides them.
     * Fallback: tilemap tile-check at ±halfWidth from the player's centre.
     */
    public get wallDir(): -1 | 0 | 1 {
        if (!this.owner.onWall) return 0;
        
        // if (this.owner.onLeft)  return -1;
        // if (this.owner.onRight) return  1;
        
        // onWall set but no left/right flag — fall back to velocity then input
        if (this._velocity.x < 0) return -1;
        if (this._velocity.x > 0) return  1;
        
        if (Input.isPressed(MBControls.MOVE_LEFT))  return -1;
        if (Input.isPressed(MBControls.MOVE_RIGHT)) return  1;
        
        return 0;
    }
    public update(deltaT: number): void {
        
        if (this.grappleCooldown > 0) this.grappleCooldown -= deltaT;
        if (this.blitzCooldown   > 0) this.blitzCooldown   -= deltaT;
        if (this.damageCooldown > 0) {
            this.damageCooldown -= deltaT;
        }
        if (this.isPaused) return;
        super.update(deltaT);
        this._transformations.update(deltaT);

        if (Input.isJustPressed(MBControls.TRANSFORM)) {
            this._transformations.toggle();
            this.owner.animation.play(PlayerAnimations.TRANSFORMATION, false);
            this.emitter.fireEvent(GameEventType.PLAY_SOUND, {key: this.scene.getTransformAudioKey(), loop: false, holdReference: false});
            this._transforming = true;                              // ← restore
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
        const isCharizard = this._transformations.activeForm?.key === "CHARIZARD";
        if (!isCharizard && Input.isPressed(MBControls.ATTACK) && !this.weapon.isSystemRunning()) {
            this.weapon.rotation = 2*Math.PI - Vec2.UP.angleToCCW(this.faceDir) + Math.PI;
            this.weapon.startSystem(500, 1, this.owner.position);
        }

        // Sludge uses arrow keys, blocked in Rowlet form
        // if (this._sludgeTimer > 0) {
        //     this._sludgeTimer -= deltaT;
        // }
        // if (Input.isJustPressed(MBControls.CYCLE_FORM)) {
        //     this._transformations.cycleNext();
        //     const selected = this._transformations.selectedForm;
        //     if (selected) {
        //         this.emitter.fireEvent(MBEvents.FORM_SELECTED, { displayName: selected.displayName });
        //     }
        // }
        // const activeForm = this._transformations.activeForm?.key ?? null;
        
        // Phantump floating controls
        // if (activeForm === "PHANTUMP") {
        //     const floatSpeed = 100; // pixels per second
        //     if (Input.isPressed(MBControls.JUMP)) {
        //         this.velocity.y = -floatSpeed;
        //     } else if (Input.isPressed(MBControls.DOWN)) {
        //         this.velocity.y = floatSpeed;
        //     } else {
        //         // No input = stay in place
        //         this.velocity.y = 0;
        //     }
        // }
        
        // if (activeForm !== "ROWLET" && this._sludgeTimer <= 0) {
        //     const dx = (Input.isPressed(MBControls.ATTACK_RIGHT) ? 1 : 0)
        //             - (Input.isPressed(MBControls.ATTACK_LEFT)  ? 1 : 0);
        //     const dy = (Input.isPressed(MBControls.ATTACK_DOWN)  ? 1 : 0)
        //             - (Input.isPressed(MBControls.ATTACK_UP)    ? 1 : 0);

        //     if (dx !== 0 || dy !== 0) {
        //         const dir = new Vec2(dx, dy).normalize();
        //         (this.owner.getScene() as MBLevel).fireSludge(
        //             this.owner.position.clone(), dir
        //         );
        //         this._sludgeTimer = this.SLUDGE_COOLDOWN;
        //     }
        // }
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
        const force = this._transformations.jumpForce ?? this.BASE_JUMP_FORCE;
        console.log("effectiveJumpForce:", force, "BASE_JUMP_FORCE:", this.BASE_JUMP_FORCE);
        return force;
    }
    public get isTransforming(): boolean { return this._transforming; }
    public get tilemap(): OrthogonalTilemap { return this._tilemap; }

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

    public getAnimationKey(base: "IDLE" | "WALK" | "JUMP" | "FALL" | "GRAPPLE" | "BLITZ"): string {
        const form = this._transformations.activeForm?.key ?? null;

        // if (form === "ROWLET") {
        //     return (base === "JUMP" || base === "FALL") 
        //         ? PlayerAnimations.ROWLET_FLY 
        //         : PlayerAnimations.ROWLET_IDLE;
        // }
        if (form === "CHARIZARD") {
            switch(base){
                case "IDLE" : return PlayerAnimations.CHARIZARD_IDLE;
                case "BLITZ" : return PlayerAnimations.CHARIZARD_BLITZ;
                default:
                    return PlayerAnimations.CHARIZARD_IDLE;
            }
        }
        if (form === "GRENINJA") {
            // Use base animations since Greninja animations aren't in spritesheet yet
            switch (base) {
                case "IDLE": return PlayerAnimations.GRENINJA_IDLE;
                case "WALK": return PlayerAnimations.GRENINJA_WALK;
                case "JUMP": return PlayerAnimations.GRENINJA_JUMP;
                case "FALL": return PlayerAnimations.GRENINJA_FALL; 
                case "GRAPPLE" : return PlayerAnimations.GRENINJA_GRAPPLE;
            }
        }
        return PlayerAnimations[base];
    }
}