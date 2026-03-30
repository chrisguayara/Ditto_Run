import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import GameEvent from "../../../Wolfie2D/Events/GameEvent";
import { PlayerAnimations, PlayerTweens } from "../PlayerController";
import { GameEventType } from "../../../Wolfie2D/Events/GameEventType";

import PlayerState from "./PlayerState";

export default class Dead extends PlayerState {

    private time: number = 0;
    private startedTween: boolean = false;
    private startedDeath: boolean = false;

    public onEnter(options: Record<string, any>): void {

        // Play the dying animation
        
        this.owner.animation.play(PlayerAnimations.DYING);
        let deathAudio = this.owner.getScene().getDeadAudioKey();
        this.emitter.fireEvent(GameEventType.PLAY_SOUND, {key: deathAudio, loop: false, holdReference: false});
        
        

        this.time = 0;
        this.startedDeath = false;
        this.startedTween = false;
    }

    public handleInput(event: GameEvent): void { }

    public update(deltaT: number): void {
        

        if (!this.owner.animation.isPlaying(PlayerAnimations.DYING) && !this.startedDeath ){
            this.owner.animation.play(PlayerAnimations.DEAD);
            this.startedDeath = true;
            
            
        }
        if (!this.startedTween && this.time > .7){
            this.owner.tweens.play(PlayerTweens.DEATH);
            this.startedTween = true;
        }
        this.time += deltaT;
        }
        
    
        
    public onExit(): Record<string, any> { return {}; }
}
