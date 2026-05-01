import GameEvent from "../../../Wolfie2D/Events/GameEvent";
import { GameEventType } from "../../../Wolfie2D/Events/GameEventType";
import { PlayerAnimations, PlayerStates } from "../PlayerController";
import PlayerState from "./PlayerState";
import Input from "../../../Wolfie2D/Input/Input";
import { MBControls } from "../../MBControls";

export default class FlareBlitz extends PlayerState {

    protected static MAX_DIST = 16;
    public onEnter(options: Record<string, any>): void {
        const origin = this.owner.position;
        const mouse  = Input.getGlobalMousePosition();

        const dx  = mouse.x - origin.x;
        const dy  = mouse.y - origin.y;

    }

    public update(deltaT: number): void {
        super.update(deltaT);
        this.owner.animation.playIfNotAlready(PlayerAnimations.CHARIZARD_BLITZ);

        if (this.owner.onGround){
            this.finished(PlayerStates.IDLE);
        }

    }

    public onExit(): Record<string, any> {
        this.owner.animation.stop();
        
        return {};
    }
}