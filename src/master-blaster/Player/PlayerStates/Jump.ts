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

        // ── Early exit: fast fall ───────────────────────────────
        if (Input.isJustPressed(MBControls.DOWN)) {
            this.finished(PlayerStates.FALL);
            this.parent.velocity.y=140;
            return;
        }

        // ── Greninja abilities ──────────────────────────────────
        if (this.parent.transformations.activeForm?.key === "GRENINJA") {

            // Tongue grapple
            if (Input.isMouseJustPressed()) {
                this.finished(PlayerStates.GRAPPLE);
                return;
            }

            // Wall slide — enter when touching any wall while airborne
            const wall = this.parent.wallDir;
            if (wall !== 0 && this.parent.velocity.y > 0) {
                this.finished(PlayerStates.WALL_SLIDE);
                return;
            }
        }

        // ── Standard jump logic ──────────────────────────────────
        if (this.owner.onGround) {
            this.finished(PlayerStates.IDLE);
            return;
        }
        if (this.parent.transformations.activeForm?.key === "CHARIZARD") {
        if (Input.isMouseJustPressed()) {
            this.finished(PlayerStates.BLITZ);
            return;
        }
        // Glide becomes available once the rocket-jump arc has peaked enough.
        // GlideState.GLIDE_ENTRY_VY = -120: player rising at < 120 px/s.
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
        this.parent.velocity.x += dir.x * this.parent.effectiveSpeed / 3.5
                                 - 0.3 * this.parent.velocity.x;
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