import { PlayerStates } from "../PlayerController";
import PlayerState from "./PlayerState";
import Input from "../../../Wolfie2D/Input/Input";
import { MBControls } from "../../MBControls";

export default class Fall extends PlayerState {

    public onEnter(options: Record<string, any>): void {
        // Reset downward velocity unless the caller asked us to preserve it
        // OR if we're moving upward (e.g., from a bounce)
        if (!options.preserveVelocity && this.parent.velocity.y > 0) {
            this.parent.velocity.y = 0;
        }
        this.owner.animation.play(this.parent.getAnimationKey("FALL"));
    }

    public update(deltaT: number): void {
        super.update(deltaT);

        // ── Fast fall ───────────────────────────────────────────
        if (Input.isJustPressed(MBControls.DOWN)) {
            this.parent.velocity.y = 140;
        }

        // ── Greninja abilities ───────────────────────────────────
        if (this.parent.transformations.activeForm?.key === "GRENINJA") {
            if (Input.isMouseJustPressed() && this.parent.grappleCooldown <=0) {
                this.finished(PlayerStates.GRAPPLE);
                return;
            }

            const wall = this.parent.wallDir;
            if (wall !== 0) {
                // Require holding into the wall — same as Jump does
                const holdingIn = (wall === 1  && Input.isPressed(MBControls.MOVE_RIGHT))
                            || (wall === -1 && Input.isPressed(MBControls.MOVE_LEFT));
                if (holdingIn) {
                    this.finished(PlayerStates.WALL_SLIDE);
                    return;
                }
            }
        }

        if (this.parent.transformations.activeForm?.key === "CHARIZARD") {
            if (Input.isMouseJustPressed()) {
                this.finished(PlayerStates.BLITZ);
                return;
            }
        }

        if (this.owner.onGround) {
            this.finished(PlayerStates.IDLE);
            return;
        }

        const dir = this.parent.inputDir;
        this.parent.velocity.x += dir.x * this.parent.speed / 3.5
                                 - 0.3 * this.parent.velocity.x;
        this.parent.velocity.y += this.parent.effectiveGravity * deltaT;
        this.owner.move(this.parent.velocity.scaled(deltaT));

        if (!this.parent.isTransforming) {
            this.owner.animation.playIfNotAlready(this.parent.getAnimationKey("FALL"));
        }
    }

    public onExit(): Record<string, any> {
        return {};
    }
}