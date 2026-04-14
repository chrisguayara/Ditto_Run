import GameEvent from "../../../Wolfie2D/Events/GameEvent";
import { GameEventType } from "../../../Wolfie2D/Events/GameEventType";
import { PlayerStates, PlayerTweens } from "../PlayerController";
import PlayerController from "../PlayerController";
import PlayerState from "./PlayerState";

export default class Jump extends PlayerState {

	public onEnter(options: Record<string, any>): void {
        let scene = this.owner.getScene()
        this.owner.animation.play(this.parent.getAnimationKey("JUMP"));
        // Give the player a burst of upward momentum
        this.parent.velocity.y = this.parent.effectiveJumpForce;

        // If the player is moving to the left or right, make them do a flip
        // if(this.parent.velocity.x !== 0){
        //     this.owner.tweens.play(PlayerTweens.FLIP);
        // }

        // Play the jump sound for the player
		this.emitter.fireEvent(GameEventType.PLAY_SOUND, {key: scene.getJumpAudioKey(), loop: false, holdReference: false});
	}

	public update(deltaT: number): void {
        super.update(deltaT);
        if (this.owner.onGround) {
			this.finished(PlayerStates.IDLE);
		} 
        else if(this.owner.onCeiling || this.parent.velocity.y >= 0){
            this.finished(PlayerStates.FALL);
		}
        else {
            let dir = this.parent.inputDir;
            // ↓ effectiveSpeed instead of speed
            this.parent.velocity.x += dir.x * this.parent.effectiveSpeed/3.5 - 0.3*this.parent.velocity.x;
            // ↓ effectiveGravity instead of this.gravity
            this.parent.velocity.y += this.parent.effectiveGravity * deltaT;
            this.owner.move(this.parent.velocity.scaled(deltaT));
        }
         if (!this.parent.isTransforming) {
            this.owner.animation.playIfNotAlready(this.parent.getAnimationKey("IDLE"));
        }   
	}

	public onExit(): Record<string, any> {
		this.owner.animation.stop();
		return {};
	}
}