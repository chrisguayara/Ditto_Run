import { PlayerStates } from "../PlayerController";
import Input from "../../../Wolfie2D/Input/Input";
import { MBControls } from "../../MBControls";
import PlayerState from "./PlayerState";

const GRENINJA_TOP_SPEED   = 220;
const GRENINJA_ACCEL_TIME  = 1.4;
const GRENINJA_CARRY_BLEND = 0.12;
const DEFAULT_DECEL        = 0.18;

export default class Walk extends PlayerState {
    private holdTimer: number = 0;

    onEnter(options: Record<string, any>): void {
        if (!this.parent.isTransforming) {
            this.owner.animation.play(this.parent.getAnimationKey("WALK"));
        }
        this.holdTimer = 0;
        this.parent.doubleJumpAvailable = true;
    }

    update(deltaT: number): void {
        super.update(deltaT);

        const dir        = this.parent.inputDir;
        const isGreninja = this.parent.transformations.activeForm?.key === "GRENINJA";

        if (dir.x !== 0) {
            this.owner.invertX = dir.x < 0;
        }

        if (isGreninja && Input.isPressed(MBControls.DOWN)) {
            this.finished(PlayerStates.CROUCHSLIDE);
            return;
        }

        // Chain-aware: don't restart blaziken_walk once it has chained to blaziken_walking
       if (!this.parent.isTransforming) {
        if (isGreninja) {
            const RUN_THRESHOLD = GRENINJA_ACCEL_TIME * 0.2;
            const animKey = this.holdTimer >= RUN_THRESHOLD
                ? this.parent.getAnimationKey("RUN")
                : this.parent.getAnimationKey("WALK");
            this.owner.animation.playIfNotAlready(animKey);
        } else {
            this.owner.animation.playIfNotAlready(this.parent.getAnimationKey("WALK"));
        }
    }

        if (Input.isMouseJustPressed()
            && this.parent.transformations.activeForm?.key === "CHARIZARD"
            && this.parent.blitzCooldown <= 0) {
            this.parent.blitzCooldown = this.parent.BLITZ_COOLDOWN_TIME;
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
                this.holdTimer = 0;
            }
            const targetVx = dir.x * this.parent.effectiveSpeed;
            this.parent.velocity.x += (targetVx - this.parent.velocity.x) * GRENINJA_CARRY_BLEND;
            
        } else {
            const targetVx = dir.x * this.parent.effectiveSpeed;
            this.parent.velocity.x += (targetVx - this.parent.velocity.x) * DEFAULT_DECEL;
        }

        this.parent.velocity.y += this.parent.effectiveGravity * deltaT;
        this.owner.move(this.parent.velocity.scaled(deltaT));
    }

    onExit(): Record<string, any> {
        this.owner.animation.stop();
        return {};
    }
}