import { PlayerStates } from "../PlayerController";
import PlayerState from "./PlayerState";
import Input from "../../../Wolfie2D/Input/Input";
import { MBControls } from "../../MBControls";

const CARRY_DECAY     = 0.56;  
const CARRY_THRESHOLD = 200;  

export default class Fall extends PlayerState {

    private carryingMomentum: boolean = false;

    public onEnter(options: Record<string, any>): void {
        const preserve = this.parent.preserveVelocityOnNextState;
        this.parent.preserveVelocityOnNextState = false;

        this.carryingMomentum = preserve;

        if (!preserve && this.parent.velocity.y > 0) {
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

        if (Input.isJustPressed(MBControls.DOWN)) {
            if (this.parent.transformations.activeForm?.key === "CHARIZARD") {
                this.finished(PlayerStates.SLAM);
                return;
            }
            this.parent.velocity.y = 140;
        }

        
        if (this.parent.transformations.activeForm?.key === "GRENINJA") {
            if (Input.isMouseJustPressed() && this.parent.grappleCooldown <= 0) {
                this.finished(PlayerStates.GRAPPLE);
                return;
            }
            const wall = this.parent.wallDir;
            if (wall !== 0) {
                const holdingIn = (wall === 1  && Input.isPressed(MBControls.MOVE_RIGHT))
                               || (wall === -1 && Input.isPressed(MBControls.MOVE_LEFT));
                if (holdingIn) {
                    this.finished(PlayerStates.WALL_SLIDE);
                    return;
                }
            }
        }

        if (this.parent.transformations.activeForm?.key === "CHARIZARD") {
            if (Input.isMouseJustPressed() && this.parent.blitzCooldown <= 0) {
                this.parent.blitzCooldown = this.parent.BLITZ_COOLDOWN_TIME;
                this.finished(PlayerStates.BLITZ);
                return;
            }
            if (Input.isJustPressed(MBControls.JUMP) && this.parent.doubleJumpAvailable) {
                this.parent.doubleJumpAvailable = false;
                this.parent.velocity.y = this.parent.effectiveJumpForce * 0.9;
                this.finished(PlayerStates.JUMP);
                return;
            }
        }

        if (this.owner.onGround) {
            this.carryingMomentum = false;
            this.finished(PlayerStates.IDLE);
            return;
        }

        const dir = this.parent.inputDir;
        const absVx = Math.abs(this.parent.velocity.x);

        if (this.carryingMomentum && absVx > CARRY_THRESHOLD) {
            this.parent.velocity.x *= CARRY_DECAY;
            if (dir.x !== 0) {
                this.parent.velocity.x += dir.x * this.parent.effectiveSpeed * 0.08;
            }
            // Once speed bleeds down, hand back to normal air control
            if (Math.abs(this.parent.velocity.x) <= CARRY_THRESHOLD) {
                this.carryingMomentum = false;
            }
        } else {
            this.carryingMomentum = false;
            this.parent.velocity.x += dir.x * this.parent.speed / 3.5
                                     - 0.3 * this.parent.velocity.x;
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