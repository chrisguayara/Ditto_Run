import { PlayerStates } from "../PlayerController";
import Input from "../../../Wolfie2D/Input/Input";
import { MBControls } from "../../MBControls";
import PlayerState from "./PlayerState";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";

/** px/s — above this on entry the player slides instead of just crouching */
const SLIDE_THRESHOLD    = 60;
/** Friction multiplier applied each frame during a slide */
const SLIDE_FRICTION     = 0.88;
/** px/s — slide ends when horizontal speed drops below this */
const SLIDE_END_SPEED    = 18;
/** Safety cap on slide duration (seconds) */
const SLIDE_MAX_DURATION = 1.2;
/** Crouch walk speed as a fraction of normal effectiveSpeed */
const CROUCH_SPEED_FRAC  = 0.5;
/** px/s vertical speed above which we consider the player truly airborne.
 *  Keeps us from flickering into FALL on every gravity tick while grounded. */
const FALL_VY_THRESHOLD  = 80;

export default class CrouchSlide extends PlayerState {

    private isSliding:    boolean = false;
    private slideTimer:   number  = 0;
    private _origSizeY:   number  = 0;

    // ── Hitbox helpers ────────────────────────────────────────────

    private shrinkHitbox(): void {
        this._origSizeY = this.owner.size.y;
        const shrink = this._origSizeY / 4;   // half the half-height
        this.owner.size.y = this._origSizeY / 2;
        // Shift centre down so feet stay at the same world-y
        this.owner.position.y += shrink;
    }

    private restoreHitbox(): void {
        if (this._origSizeY === 0) return;
        const shrink = this._origSizeY / 4;
        this.owner.size.y = this._origSizeY;
        this.owner.position.y -= shrink;
        this._origSizeY = 0;
    }

    // ─────────────────────────────────────────────────────────────

    public onEnter(options: Record<string, any>): void {
        this.shrinkHitbox();

        const speed = Math.abs(this.parent.velocity.x);
        this.isSliding = speed > SLIDE_THRESHOLD;
        this.slideTimer = 0;

        if (!this.isSliding) {
            // Pure crouch — bleed off horizontal momentum quickly
            this.parent.velocity.x *= 0.3;
        }

        // Placeholder animation until a crouch/slide sprite exists
        if (!this.parent.isTransforming) {
            this.owner.animation.play(this.parent.getAnimationKey("IDLE"));
        }
    }

    public update(deltaT: number): void {
        super.update(deltaT);

        // Apply gravity every frame so the player stays on slopes/ground
        this.parent.velocity.y += this.parent.effectiveGravity * deltaT;

        // ── Universal exits ───────────────────────────────────────

        // Jump cancels both slide and crouch
        if (Input.isJustPressed(MBControls.JUMP)) {
            this.finished(PlayerStates.JUMP);
            return;
        }

        // Fell off a ledge — only transition when velocity is meaningfully downward
        // to avoid flickering from normal gravity ticks while grounded.
        if (!this.owner.onGround && this.parent.velocity.y > FALL_VY_THRESHOLD) {
            this.finished(PlayerStates.FALL);
            return;
        }

        // ── Slide branch ──────────────────────────────────────────
        if (this.isSliding) {
            this.slideTimer += deltaT;

            // Friction deceleration
            this.parent.velocity.x *= SLIDE_FRICTION;

            this.owner.move(this.parent.velocity.scaled(deltaT));

            const speed    = Math.abs(this.parent.velocity.x);
            const timedOut = this.slideTimer >= SLIDE_MAX_DURATION;

            if (speed < SLIDE_END_SPEED || timedOut) {
                // Slide has wound down — stay crouching if key still held, else idle
                const crouchHeld = Input.isPressed(MBControls.CROUCH)
                                || Input.isPressed(MBControls.DOWN);
                if (crouchHeld) {
                    // Switch to stationary crouch mode without re-entering the state
                    this.isSliding = false;
                    this.parent.velocity.x = 0;
                } else {
                    this.finished(PlayerStates.IDLE);
                }
                return;
            }

        // ── Crouch branch ─────────────────────────────────────────
        } else {
            const crouchHeld = Input.isPressed(MBControls.CROUCH)
                            || Input.isPressed(MBControls.DOWN);

            if (!crouchHeld) {
                // Released crouch — go to run or idle depending on input
                const dir = this.parent.inputDir;
                this.finished(dir.x !== 0 ? PlayerStates.RUN : PlayerStates.IDLE);
                return;
            }

            // Allow slow horizontal movement while crouching
            const dir = this.parent.inputDir;
            if (dir.x !== 0) {
                this.owner.invertX = dir.x < 0;
                const targetVx = dir.x * this.parent.effectiveSpeed * CROUCH_SPEED_FRAC;
                this.parent.velocity.x += (targetVx - this.parent.velocity.x) * 0.15;
            } else {
                // Passive decel to a stop
                this.parent.velocity.x *= 0.75;
            }

            this.owner.move(this.parent.velocity.scaled(deltaT));
        }

        if (!this.parent.isTransforming) {
            this.owner.animation.playIfNotAlready(this.parent.getAnimationKey("IDLE"));
        }
    }

    public onExit(): Record<string, any> {
        this.restoreHitbox();
        this.owner.animation.stop();
        return {};
    }
}