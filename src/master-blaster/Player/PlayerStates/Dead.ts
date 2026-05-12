import GameEvent from "../../../Wolfie2D/Events/GameEvent";
import { PlayerTweens } from "../PlayerController";
import PlayerState from "./PlayerState";

/**
 * The Dead state for the player's FSM AI. 
 */
export default class Dead extends PlayerState {
    private timer: number = 0;
    private tweenStarted: boolean = false;
    private readonly TWEEN_DELAY = 0.5;

    public onEnter(options: Record<string, any>): void {
        this.owner.animation.play(this.parent.getAnimationKey("DEATH"), false);
        this.timer = 0;
        this.tweenStarted = false;
    }

    public update(deltaT: number): void {
        if (this.tweenStarted) return;
        this.timer += deltaT;
        if (this.timer >= this.TWEEN_DELAY) {
            this.tweenStarted = true;
            this.owner.tweens.play(PlayerTweens.DEATH);
        }
    }

    public handleInput(event: GameEvent): void { }
    public onExit(): Record<string, any> { return {}; }
}