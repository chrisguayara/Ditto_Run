import PokemonState from "./PokemonState";
import PokemonController from "../PokemonController";
import MBAnimatedSprite from "../../Nodes/MBAnimatedSprite";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import RotomController, { RotomStates, RotomAnimations } from "../PokemonActors/RotomController";

export default class RotomOrbit extends PokemonState {

    private _angle: number = 0;           // current orbit angle in radians
    private readonly ORBIT_RADIUS = 28;
    private readonly ORBIT_SPEED  = 1.8;  // radians per second
    
    // Random spurt state
    private _spurtTimer:     number = 0;
    private _nextSpurtIn:    number = 0;
    private _spurtVel:       Vec2   = Vec2.ZERO;
    private _spurtDuration:  number = 0;
    private _spurting:       boolean = false;

    // How long to stay still before going back to follow
    private _playerMoveTimer: number = 0;
    private _prevPlayerPos:   Vec2   = Vec2.ZERO;
    private readonly FOLLOW_THRESH = 0.5; // seconds of movement before switching back

    public constructor(parent: PokemonController, owner: MBAnimatedSprite) {
        super(parent, owner);
    }

    public onEnter(_options: Record<string, any>): void {
        this.owner.animation.playIfNotAlready(RotomAnimations.IDLE, true);
        this._prevPlayerPos = this.parent.playerRef.position.clone();
        this._playerMoveTimer = 0;
        this._scheduleNextSpurt();
    }

    public update(deltaT: number): void {
        super.update(deltaT);
        const rotom  = this.parent as RotomController;
        const player = this.parent.playerRef;

        // ── Check if player started moving again ─────────────────
        const moved = player.position.distanceTo(this._prevPlayerPos);
        this._prevPlayerPos = player.position.clone();

        if (moved > rotom.STILL_THRESH * deltaT) {
            this._playerMoveTimer += deltaT;
        } else {
            this._playerMoveTimer = 0;
        }

        if (this._playerMoveTimer >= this.FOLLOW_THRESH) {
            this.finished(RotomStates.FOLLOW);
            return;
        }

        // ── Advance orbit angle ───────────────────────────────────
        this._angle += this.ORBIT_SPEED * deltaT;

        const orbitTarget = new Vec2(
            player.position.x + Math.cos(this._angle) * this.ORBIT_RADIUS,
            player.position.y + Math.sin(this._angle) * this.ORBIT_RADIUS - 8
        );

        // ── Random spurt ──────────────────────────────────────────
        this._spurtTimer -= deltaT;
        if (this._spurting) {
            this.owner.move(this._spurtVel.scaled(deltaT));
            if (this._spurtTimer <= 0) {
                this._spurting = false;
                this._scheduleNextSpurt();
            }
            return; // skip normal orbit movement during spurt
        }

        if (this._spurtTimer <= 0 && !this._spurting) {
            // kick off a spurt
            const angle = Math.random() * Math.PI * 2;
            const mag   = 60 + Math.random() * 60;
            this._spurtVel      = new Vec2(Math.cos(angle) * mag, Math.sin(angle) * mag);
            this._spurtDuration = 0.2 + Math.random() * 0.3;
            this._spurtTimer    = this._spurtDuration;
            this._spurting      = true;
            return;
        }

        // ── Normal orbit movement ─────────────────────────────────
        const toTarget = orbitTarget.clone().sub(this.owner.position);
        const dir = toTarget.mag() > 2 ? toTarget.normalize() : Vec2.ZERO;

        this.parent.velocity.x = dir.x * rotom.speed;
        this.parent.velocity.y = dir.y * rotom.speed;
        this.owner.move(this.parent.velocity.scaled(deltaT));
        this.owner.invertX = this.parent.velocity.x < 0;
    }

    private _scheduleNextSpurt(): void {
        this._spurtTimer = 1.5 + Math.random() * 2.5; // spurt every 1.5–4s
        this._spurting   = false;
    }

    public onExit(): Record<string, any> {
        return {};
    }
}