import { PlayerStates } from "../PlayerController";
import Input from "../../../Wolfie2D/Input/Input";
import { MBControls } from "../../MBControls";
import PlayerState from "./PlayerState";

export default class Walk extends PlayerState {
    private timer :number = 0;
    private speedboost : number = 0;

    onEnter(options: Record<string, any>): void {
        this.parent.speed = this.parent.MIN_SPEED;

        if (!this.parent.isTransforming) {
            this.owner.animation.play(this.parent.getAnimationKey("WALK"));
        }
        

    }

    update(deltaT: number): void {
        super.update(deltaT);
        if (this.parent.inputDir.x !== 0) {
            this.owner.invertX = this.parent.inputDir.x < 0;
        }   
        if (!this.parent.isTransforming) {
            this.owner.animation.playIfNotAlready(this.parent.getAnimationKey("WALK"));
        }

        let dir = this.parent.inputDir;
        if (Input.isMouseJustPressed()
            && this.parent.transformations.activeForm?.key === "CHARIZARD") {
            this.finished(PlayerStates.BLITZ);
            return;
        }
        if (dir.isZero()) {
            this.finished(PlayerStates.IDLE);
        } else if (Input.isJustPressed(MBControls.JUMP)) {
            this.finished(PlayerStates.JUMP);
        } else if (!this.owner.onGround && this.parent.velocity.y !== 0) {
            // Transition to FALL for both falling (positive Y) and bouncing (negative Y)
            this.finished(PlayerStates.FALL);
        } else {
            
            if (this.timer == 1000){
                this.speedboost = 20;
            }
            this.parent.velocity.y += this.parent.effectiveGravity * deltaT;
            this.parent.velocity.x = dir.x * this.parent.effectiveSpeed +this.speedboost;
            this.owner.move(this.parent.velocity.scaled(deltaT));
        }

        if (this.parent.transformations.activeForm?.key === "CHARIZARD") {
            if (Input.isMouseJustPressed()) {
                this.finished(PlayerStates.BLITZ);
                return;
            }
        }
        this.timer++;
    }

    onExit(): Record<string, any> {
        this.owner.animation.stop();
        return {};
    }
}