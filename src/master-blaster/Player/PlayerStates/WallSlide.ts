import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import Input from "../../../Wolfie2D/Input/Input";
import { MBControls } from "../../MBControls";
import { PlayerAnimations, PlayerStates } from "../PlayerController";
import PlayerState from "./PlayerState";

export default class WallSlide extends PlayerState {

    // Slide faster — player should feel the wall, not float on it
    private static readonly SLIDE_GRAVITY_MULT: number = 0;
    private static readonly MAX_SLIDE_SPEED: number    = 0;

    private wallSide: -1 | 1 = 1;
    private _wallJumped: boolean = false;

    public onEnter(options: Record<string, any>): void {
        console.log("ON WALL");
        this._wallJumped = false;
        const wall = this.parent.wallDir;
        this.wallSide = (wall !== 0 ? wall : 1) as -1 | 1;

        // Kill upward momentum so it feels like you grabbed the wall
        if (this.parent.velocity.y < 0) this.parent.velocity.y = 0;

        this.owner.animation.playIfNotAlready(
            this.parent.getAnimationKey("JUMP"), true
        );
    }

    public update(deltaT: number): void {
        super.update(deltaT);
        

        this.owner.invertX = this.wallSide > 0;

        if (this.owner.onGround) {
            console.log("JUST FALLING OFF");
            
            this.finished(PlayerStates.IDLE);
            return;
        }

        // Player must hold INTO the wall — let go = fall immediately
        const holdingIntoWall = (this.wallSide === 1  && Input.isPressed(MBControls.MOVE_RIGHT))
                             || (this.wallSide === -1 && Input.isPressed(MBControls.MOVE_LEFT));

        if (!holdingIntoWall) {
            console.log("NOT HOLDING ON");
            this.finished(PlayerStates.FALL);
            
            return;
        }
        // if (!this.owner.onWall) {
        //     console.log("NOT ON WALL");
        //     this.finished(PlayerStates.FALL);
        //     return;
        // }

        if (Input.isJustPressed(MBControls.JUMP) && holdingIntoWall) {
            console.log("ATTEMPTING TO WALLJUMP");
            this._wallJumped = true;
            // Strong horizontal kick away from wall, good vertical
            this.parent.velocity.x = -this.wallSide * 500;
            this.parent.velocity.y = -340;
            this.finished(PlayerStates.JUMP);
            return;
        }

        // Replace the wallDir === 0 check with:
        

        // Wall jump — kick hard in opposite direction + upward
        

        if (Input.isMouseJustPressed()) {
            this.finished(PlayerStates.GRAPPLE);
            return;
        }

        // Slide down — gravity scaled, capped
        this.parent.velocity.y += this.parent.effectiveGravity
                                 * WallSlide.SLIDE_GRAVITY_MULT
                                 * deltaT;

        if (this.parent.velocity.y > WallSlide.MAX_SLIDE_SPEED) {
            this.parent.velocity.y = WallSlide.MAX_SLIDE_SPEED;
        }

        this.parent.velocity.x = 0; // stay flush against wall
        this.owner.move(this.parent.velocity.scaled(deltaT));
    }

    
    public onExit(): Record<string, any> {
        this.owner.animation.stop();
        // Small kick away from wall so physics doesn't re-detect immediately
        if (!this._wallJumped) {
            this.parent.velocity.x = -this.wallSide * 30;
        }
        return { wallJump: this._wallJumped };
    }
}