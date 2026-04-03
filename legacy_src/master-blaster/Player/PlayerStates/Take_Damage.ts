import { PlayerStates, PlayerAnimations } from "../PlayerController";
import PlayerState from "./PlayerState";
import Input from "../../../Wolfie2D/Input/Input";
import { MBControls } from "../../MBControls";
import { GameEventType } from "../../../Wolfie2D/Events/GameEventType";


export default class Take_Damage extends PlayerState {
    public doneEntering = false;

    public onEnter(): void {
        this.parent.velocity.x = 0;
        this.parent.velocity.y = 0;

        let hurtAudio = this.owner.getScene().getHurtAudioKey();

        this.emitter.fireEvent(GameEventType.PLAY_SOUND, {key: hurtAudio, loop: false, holdReference: false});

        this.owner.animation.play(PlayerAnimations.TAKE_DAMAGE);
        this.doneEntering = true;

        
    }

    public update(deltaT: number): void {
        
        if (!this.owner.animation.isPlaying(PlayerAnimations.TAKE_DAMAGE) && this.doneEntering === true) {
            this.finished(PlayerStates.IDLE);
        }
        
    }

    

    public onExit(): Record<string, any> {
        this.owner.animation.stop();
        return {};
    }
}