// RowletFlee.ts
import PokemonState from "./PokemonState";
import { PokemonStates, PokemonAnimations } from "../PokemonController";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import MBAnimatedSprite from "../../Nodes/MBAnimatedSprite";
import PokemonController from "../PokemonController";

export default class Flee extends PokemonState {

    private readonly FLEE_SPEED: number = 160;
    private readonly FLEE_DURATION: number = 2.5; // seconds
    private timer: number = 0;

    public onEnter(options: Record<string, any>): void {
        this.owner.animation.play(PokemonAnimations.WALK, true);
        this.timer = 0;
    }
    public constructor(parent: PokemonController, owner: MBAnimatedSprite) {
            super(parent, owner);
    }

    public update(deltaT: number): void {
        super.update(deltaT);
        this.timer += deltaT;

        const fleeDir = this.owner.position.clone().sub(this.parent.playerRef.position).normalize();

        // Fly away, bias upward and ignore gravity
        this.parent.velocity.x = fleeDir.x * this.FLEE_SPEED;
        this.parent.velocity.y = -this.FLEE_SPEED * 0.6; // always fly upward while fleeing
        this.owner.move(this.parent.velocity.scaled(deltaT));

        this.owner.invertX = this.parent.velocity.x < 0;

        if (this.timer >= this.FLEE_DURATION) {
            this.finished(PokemonStates.PATROL);
        }
    }

    public onExit(): Record<string, any> {
        this.parent.velocity.x = 0;
        return {};
    }
}