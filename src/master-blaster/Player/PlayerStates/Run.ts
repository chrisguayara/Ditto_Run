import { PlayerStates } from "../PlayerController";
import Input from "../../../Wolfie2D/Input/Input";
import { MBControls } from "../../MBControls";
import PlayerState from "./PlayerState";

const GRENINJA_TOP_SPEED    = 220;   // max sprint speed
const GRENINJA_ACCEL_TIME   = 1.4;   // seconds to reach top speed from zero
const GRENINJA_CARRY_BLEND  = 0.12;  // how much grapple momentum carries over per frame (0=none, 1=full)
const DEFAULT_DECEL         = 0.18;  // how quickly non-Greninja forms stop

export default class Walk extends PlayerState {
    private holdTimer: number = 0;   // how long we've been holding a direction

    onEnter(options: Record<string, any>): void {
        if (!this.parent.isTransforming) {
            this.owner.animation.play(this.parent.getAnimationKey("WALK"));
        }
        // Don't reset velocity — let momentum carry in from grapple/fall.
        // We'll blend toward run speed in update().
        this.holdTimer = 0;
    }

    update(deltaT: number): void {
        super.update(deltaT);

        const dir = this.parent.inputDir;
        const isGreninja = this.parent.transformations.activeForm?.key === "GRENINJA";

        if (dir.x !== 0) {
            this.owner.invertX = dir.x < 0;
        }

        if (!this.parent.isTransforming) {
            this.owner.animation.playIfNotAlready(this.parent.getAnimationKey("WALK"));
        }

        // ── State transitions ──
        if (Input.isMouseJustPressed()
            && this.parent.transformations.activeForm?.key === "CHARIZARD") {
            this.finished(PlayerStates.BLITZ);
            return;
        }
        if (dir.isZero()) {
            this.finished(PlayerStates.IDLE);
            return;
        }
        if (Input.isJustPressed(MBControls.JUMP)) {
            this.finished(PlayerStates.JUMP);
            return;
        }
        if (!this.owner.onGround && this.parent.velocity.y !== 0) {
            this.finished(PlayerStates.FALL);
            return;
        }

        if (isGreninja) {
            const sameDir = Math.sign(this.parent.velocity.x) === dir.x
                         || Math.abs(this.parent.velocity.x) < 10;
            if (sameDir) {
                this.holdTimer = Math.min(this.holdTimer + deltaT, GRENINJA_ACCEL_TIME);
            } else {
                // Turned around — reset acceleration
                this.holdTimer = 0;
            }

            // Ramp from MIN_SPEED to top speed over GRENINJA_ACCEL_TIME
            const t = this.holdTimer / GRENINJA_ACCEL_TIME;
            const targetSpeed = this.parent.effectiveSpeed;

            // Blend current velocity toward target — preserves carry-over from grapple
            const targetVx = dir.x * targetSpeed;
            this.parent.velocity.x += (targetVx - this.parent.velocity.x) * GRENINJA_CARRY_BLEND;

        } else {
            // Non-Greninja: snap to base effectiveSpeed, blend out any carried momentum
            const targetVx = dir.x * this.parent.effectiveSpeed;
            this.parent.velocity.x += (targetVx - this.parent.velocity.x) * DEFAULT_DECEL;
        }

        // Gravity (keeps player grounded on slopes)
        this.parent.velocity.y += this.parent.effectiveGravity * deltaT;

        this.owner.move(this.parent.velocity.scaled(deltaT));
    }

    onExit(): Record<string, any> {
        this.owner.animation.stop();
        // Don't zero velocity — let momentum carry into the next state
        return {};
    }
}