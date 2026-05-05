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

        const turndir = this.parent.inputDir;
        

        if (turndir.x !== 0) {
            this.owner.invertX = turndir.x < 0;
        }   

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
            // Attack
            if (Input.isMouseJustPressed()) {
                this.finished(PlayerStates.BLITZ);
                return;
            }
            // Glide — available immediately in fall (player is already descending)
            if (Input.isPressed(MBControls.JUMP)) {
                this.finished(PlayerStates.GLIDE);
                return;
            }
        }

        if (this.owner.onGround) {
            // fall damage is just annoying and punishes grapples/blitz as charizard
            // this.parent.health -= Math.floor(this.parent.velocity.y / 300);
            this.finished(PlayerStates.IDLE);
            return;
        }
        
        

        const dir = this.parent.inputDir;
        const maxX = this.parent.effectiveSpeed * 1.3;

        this.parent.velocity.x += dir.x * 220 * deltaT;

        
        if (Math.abs(this.parent.velocity.x) > maxX) {
            this.parent.velocity.x *= 1 - (1.5 * deltaT);
        }

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