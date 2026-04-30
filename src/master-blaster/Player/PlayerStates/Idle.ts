import { PlayerStates } from "../PlayerController";
import PlayerState from "./PlayerState";
import Input from "../../../Wolfie2D/Input/Input";
import { MBControls } from "../../MBControls";

export default class Idle extends PlayerState {

    public onEnter(options: Record<string, any>): void {
        this.parent.speed = this.parent.MIN_SPEED;
        this.parent.velocity.y = 0;

        if (!this.parent.isTransforming) {
            this.owner.animation.play(this.parent.getAnimationKey("IDLE"));
        }
    }

    public update(deltaT: number): void {
        super.update(deltaT);

        if (!this.parent.isTransforming) {
        this.owner.animation.playIfNotAlready(this.parent.getAnimationKey("IDLE"));
    }

        //  let off horizontal momentum when idle
        const dir = this.parent.inputDir;
        if (dir.x === 0) {
            this.parent.velocity.x *= 1 - (8 * deltaT); // quick friction
            if (Math.abs(this.parent.velocity.x) < 5) this.parent.velocity.x = 0;
        }

        if (!dir.isZero() && dir.y === 0) {
            this.finished(PlayerStates.RUN);
        } else if (Input.isJustPressed(MBControls.JUMP)) {
            this.finished(PlayerStates.JUMP);
        } else if (!this.owner.onGround && this.parent.velocity.y !== 0) {
            this.finished(PlayerStates.FALL);
        } else {
            this.parent.velocity.y += this.parent.effectiveGravity * deltaT;
            this.owner.move(this.parent.velocity.scaled(deltaT));
        }
    }

    public onExit(): Record<string, any> {
        this.owner.animation.stop();
        return {};
    }
}