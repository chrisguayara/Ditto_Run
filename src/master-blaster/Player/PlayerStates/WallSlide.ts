import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import Input from "../../../Wolfie2D/Input/Input";
import { MBControls } from "../../MBControls";
import { PlayerStates } from "../PlayerController";
import PlayerState from "./PlayerState";

export default class WallSlide extends PlayerState {

    private static readonly SLIDE_GRAVITY_MULT: number = 0.25;
    private static readonly MAX_SLIDE_SPEED: number    = 80;

    private wallSide: -1 | 1 = 1;
    private _wallJumped: boolean = false;

    public onEnter(options: Record<string, any>): void {
        this._wallJumped = false;

        const wall = this.parent.wallDir;
        this.wallSide = (wall !== 0 ? wall : 1) as -1 | 1;

        // Nudge player flush against the wall so it doesn't look floaty

        if (this.parent.velocity.y < 0) this.parent.velocity.y = 0;

        this.owner.animation.play(this.parent.getAnimationKey("JUMP"));
    }

    public update(deltaT: number): void {
        super.update(deltaT);

        this.owner.invertX = this.wallSide > 0;

        if (this.owner.onGround) {
            this.finished(PlayerStates.IDLE);
            return;
        }

        if (Input.isJustPressed(MBControls.JUMP)) {
            this._wallJumped = true;
            // Equal X and Y magnitude = 45 degree launch angle
            const jumpMag =200;
            this.parent.velocity.x = -400;
            this.parent.velocity.y = -400;
            this.finished(PlayerStates.JUMP);
            return;
        }

        if (Input.isMouseJustPressed()) {
            this.finished(PlayerStates.GRAPPLE);
            return;
        }

        if (this.parent.wallDir === 0) {
            this.finished(PlayerStates.FALL);
            return;
        }

        this.parent.velocity.y += this.parent.effectiveGravity
                                 * WallSlide.SLIDE_GRAVITY_MULT
                                 * deltaT;

        if (this.parent.velocity.y > WallSlide.MAX_SLIDE_SPEED) {
            this.parent.velocity.y = WallSlide.MAX_SLIDE_SPEED;
        }

        this.owner.move(this.parent.velocity.scaled(deltaT));
    }

    public onExit(): Record<string, any> {
        this.owner.animation.stop();
        return { wallJump: this._wallJumped };
    }
}