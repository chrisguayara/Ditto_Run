import PokemonState from "./PokemonState";
import PokemonController from "../PokemonController";
import MBAnimatedSprite from "../../Nodes/MBAnimatedSprite";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import RotomController, { RotomStates, RotomAnimations } from "../PokemonActors/RotomController";

export default class RotomFollow extends PokemonState {

    private _prevPlayerPos: Vec2 = Vec2.ZERO;
    private _stillTimer: number = 0;
    private readonly STILL_TIME = 1.2; // seconds before switching to orbit

    public constructor(parent: PokemonController, owner: MBAnimatedSprite) {
        super(parent, owner);
    }

    public onEnter(_options: Record<string, any>): void {
        this.owner.animation.playIfNotAlready(RotomAnimations.FLOAT, true);
        this._prevPlayerPos = this.parent.playerRef.position.clone();
        this._stillTimer = 0;
    }

    public update(deltaT: number): void {
        super.update(deltaT);
        const rotom  = this.parent as RotomController;
        const player = this.parent.playerRef;

        // ── Check if player is still ─────────────────────────────
        const playerMoved = player.position.distanceTo(this._prevPlayerPos);
        this._prevPlayerPos = player.position.clone();

        if (playerMoved < rotom.STILL_THRESH * deltaT) {
            this._stillTimer += deltaT;
        } else {
            this._stillTimer = 0;
        }

        if (this._stillTimer >= this.STILL_TIME) {
            this.finished(RotomStates.ORBIT);
            return;
        }

        // ── Move toward a point offset from the player ───────────
        // Hover to the upper-right of the player
        const target = player.position.clone().add(new Vec2(20, -20));
        const toTarget = target.clone().sub(this.owner.position);
        const dist = toTarget.mag();

        if (dist > 4) {
            const dir = toTarget.normalize();
            this.parent.velocity.x = dir.x * rotom.speed;
            this.parent.velocity.y = dir.y * rotom.speed;
        } else {
            this.parent.velocity.x = 0;
            this.parent.velocity.y = 0;
        }

        this.owner.move(this.parent.velocity.scaled(deltaT));
        this.owner.invertX = this.parent.velocity.x < 0;
    }

    public onExit(): Record<string, any> {
        return {};
    }
}