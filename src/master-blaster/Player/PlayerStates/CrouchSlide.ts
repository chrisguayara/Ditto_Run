import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import Input from "../../../Wolfie2D/Input/Input";
import { MBControls } from "../../MBControls";
import { PlayerAnimations, PlayerStates } from "../PlayerController";
import PlayerState from "./PlayerState";
import AABB from "../../../Wolfie2D/DataTypes/Shapes/AABB";

// ── Tuning ────────────────────────────────────────────────────────────────────
/** px/s, above this on entry the player slides instead of crouching */
const SLIDE_THRESHOLD    =30;
const SLIDE_BOOST         = 1.3; 
/** Friction multiplier per frame during slide */
const SLIDE_FRICTION     = 0.995;
/** px/s, slide ends when horizontal speed drops below this */
const SLIDE_END_SPEED    = 20;
/** Safety cap on slide duration (seconds) */
const SLIDE_MAX_DURATION = 1.2;
/** Crouch walk speed as a fraction of effectiveSpeed */
const CROUCH_SPEED_FRAC  = 0.45;
/** Jump force override while crouching, higher than normal */
const CROUCH_JUMP_FORCE  = -320;
/** Jump force during a slide cancel, fastest exit */
const SLIDE_JUMP_FORCE   = -300;
/** Extra horizontal boost on slide-jump, in the slide direction */
const SLIDE_JUMP_VX_BOOST = 140;
/** Downward velocity threshold before we transition to FALL */
const FALL_VY_THRESHOLD  = 80;

export default class CrouchSlide extends PlayerState {

    private isSliding:  boolean = false;
    private slideTimer: number  = 0;
    private slideDir:   number  = 0; // -1 or 1, captured on slide start
    private origHeight: number  = 0;

    // ── Hitbox ────────────────────────────────────────────────────

   private shrinkHitbox(): void {
        const collider = this.owner.collisionShape as AABB;
        this.origHeight = collider.halfSize.y;
        collider.halfSize.y = this.origHeight / 2;
        // Shift position down so feet stay on the ground
        this.owner.position.y += this.origHeight / 2;
    }

    private restoreHitbox(): void {
        if (this.origHeight === 0) return;
        const collider = this.owner.collisionShape as AABB;
        collider.halfSize.y = this.origHeight;
        this.owner.position.y -= this.origHeight / 2;
        this.origHeight = 0;
    }

    // ── Lifecycle ─────────────────────────────────────────────────

    public onEnter(options: Record<string, any>): void {
        this.shrinkHitbox();

        const speed = Math.abs(this.parent.velocity.x);
        this.isSliding  = speed > SLIDE_THRESHOLD;
        this.slideTimer = 0;
        this.slideDir   = Math.sign(this.parent.velocity.x) || 1;

           if (this.isSliding) {
                // Boost entry speed so sliding feels like committing to a move
                this.parent.velocity.x *= SLIDE_BOOST;
            } else {
                this.parent.velocity.x *= 0.25;
            }

        this.playAnim();
    }

    public update(deltaT: number): void {
        super.update(deltaT);

        // Gravity keeps the player grounded on slopes
        this.parent.velocity.y += this.parent.effectiveGravity * deltaT;

        // ── Global exits ──────────────────────────────────────────

        // Fell off a ledge
        if (!this.owner.onGround && this.parent.velocity.y > FALL_VY_THRESHOLD) {
            this.finished(PlayerStates.FALL);
            return;
        }

        // Jump, behaviour differs between slide and crouch
        if (Input.isJustPressed(MBControls.JUMP)) {
            if (this.isSliding) {
                // Slide-jump: preserve slide direction with a boost
                this.parent.velocity.x =
                    this.slideDir * (Math.abs(this.parent.velocity.x) + SLIDE_JUMP_VX_BOOST);
                this.parent.velocity.y = SLIDE_JUMP_FORCE;
            } else {
                // Crouch-jump: higher than normal, no horizontal override
                this.parent.velocity.y = CROUCH_JUMP_FORCE;
            }
            this.finished(PlayerStates.JUMP);
            return;
        }

        // ── Slide branch ──────────────────────────────────────────

        if (this.isSliding) {
            this.slideTimer += deltaT;

            // Apply friction
            this.parent.velocity.x *= SLIDE_FRICTION;
            this.owner.move(this.parent.velocity.scaled(deltaT));

            const speed    = Math.abs(this.parent.velocity.x);
            const timedOut = this.slideTimer >= SLIDE_MAX_DURATION;

            if (speed < SLIDE_END_SPEED || timedOut) {
                // Slide wound down
                if (Input.isPressed(MBControls.DOWN)) {
                    // Stay crouching
                    this.isSliding = false;
                    this.parent.velocity.x = 0;
                    this.playAnim();
                } else {
                    this.finished(PlayerStates.IDLE);
                }
            }

            this.playAnim();
            return;
        }

        // ── Crouch branch ─────────────────────────────────────────

        // Release crouch key → return to movement
        if (!Input.isPressed(MBControls.DOWN)) {
            const dir = this.parent.inputDir;
            this.finished(dir.x !== 0 ? PlayerStates.RUN : PlayerStates.IDLE);
            return;
        }

        // Allow slow horizontal movement while crouching
        const dir = this.parent.inputDir;
        if (dir.x !== 0) {
            this.owner.invertX = dir.x < 0;
            const targetVx = dir.x * this.parent.effectiveSpeed * CROUCH_SPEED_FRAC;
            // Soft blend toward target speed
            this.parent.velocity.x += (targetVx - this.parent.velocity.x) * 0.15;
        } else {
            // Passive decel
            this.parent.velocity.x *= 0.75;
        }

        this.owner.move(this.parent.velocity.scaled(deltaT));
        this.playAnim();
    }

    public onExit(): Record<string, any> {
        this.restoreHitbox();
        this.owner.animation.stop();
        return {};
    }

    // ── Helpers ───────────────────────────────────────────────────

    private playAnim(): void {
        if (this.parent.isTransforming) return;
        const key = this.isSliding
            ? this.parent.getAnimationKey("SLIDE")
            : this.parent.getAnimationKey("CROUCH");
        this.owner.animation.playIfNotAlready(key);
    }
}