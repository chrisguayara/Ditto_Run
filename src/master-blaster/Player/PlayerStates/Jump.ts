import GameEvent from "../../../Wolfie2D/Events/GameEvent";
import { GameEventType } from "../../../Wolfie2D/Events/GameEventType";
import { PlayerStates } from "../PlayerController";
import PlayerState from "./PlayerState";
import Input from "../../../Wolfie2D/Input/Input";
import { MBControls } from "../../MBControls";
import GlideState from "./GlideState";

export default class Jump extends PlayerState {

    public onEnter(options: Record<string, any>): void {
        const scene = this.owner.getScene();
        this.owner.animation.play(this.parent.getAnimationKey("JUMP"));

        // options.wallJump = true is set by WallSlide.onExit() after a wall jump.
        // In that case velocity is already set — don't override it.
        if (!options.wallJump) {
            this.parent.velocity.y = this.parent.effectiveJumpForce;
        }

        this.emitter.fireEvent(GameEventType.PLAY_SOUND, {
            key: scene.getJumpAudioKey(),
            loop: false,
            holdReference: false
        });
    }

    public update(deltaT: number): void {
        super.update(deltaT);
    
        if (Input.isJustPressed(MBControls.DOWN)) {
            this.parent.velocity.y = 140;
            this.finished(PlayerStates.FALL);
            return;
        }
    
        if (this.parent.transformations.activeForm?.key === "GRENINJA") {
            if (Input.isMouseJustPressed() && this.parent.grappleCooldown <= 0) {
                this.finished(PlayerStates.GRAPPLE);
                return;
            }
            const wall = this.parent.wallDir;
            if (wall !== 0 && this.parent.velocity.y > 0) {
                this.finished(PlayerStates.WALL_SLIDE);
                return;
            }
        }
    
        if (this.owner.onGround) {
            this.finished(PlayerStates.IDLE);
            return;
        }
    
        if (this.parent.transformations.activeForm?.key === "CHARIZARD") {
            if (Input.isMouseJustPressed()) {
                this.finished(PlayerStates.BLITZ);
                return;
            }
            if (Input.isPressed(MBControls.JUMP)
                && this.parent.velocity.y > GlideState.GLIDE_ENTRY_VY) {
                this.finished(PlayerStates.GLIDE);
                return;
            }
        }
    
        if (this.owner.onCeiling || this.parent.velocity.y >= 0) {
            this.finished(PlayerStates.FALL);
            return;
        }
    
        const dir = this.parent.inputDir;
        const isGreninja = this.parent.transformations.activeForm?.key === "GRENINJA";
    
        if (isGreninja) {
            
            const targetVx = dir.x * this.parent.effectiveSpeed;
            const currentAbs = Math.abs(this.parent.velocity.x);
    
            if (dir.x !== 0) {
                // If we're already moving faster than base speed in the right direction,
                // only apply a tiny correction so we don't instantly bleed the bonus speed.
                const carryingMomentum = Math.sign(this.parent.velocity.x) === dir.x
                                      && currentAbs > this.parent.effectiveSpeed;
                const blendRate = carryingMomentum ? 0.03 : 0.10;
                this.parent.velocity.x += (targetVx - this.parent.velocity.x) * blendRate;
            } else {
                // No input: very light passive drag so Greninja still floats a bit
                this.parent.velocity.x *= 0.98;
            }
        } else {
            // Non-Greninja: original feel, moderate air control with drag
            this.parent.velocity.x += dir.x * this.parent.effectiveSpeed / 3.5
                                     - 0.3 * this.parent.velocity.x;
        }
    
        this.parent.velocity.y += this.parent.effectiveGravity * deltaT;
        this.owner.move(this.parent.velocity.scaled(deltaT));
    
        if (!this.parent.isTransforming) {
            this.owner.animation.playIfNotAlready(this.parent.getAnimationKey("JUMP"));
        }
    }

    public onExit(): Record<string, any> {
        this.owner.animation.stop();
        return {};
    }
}