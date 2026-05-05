import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import Input from "../../../Wolfie2D/Input/Input";
import { PlayerAnimations, PlayerStates } from "../PlayerController";
import PlayerState from "./PlayerState";
import CharizardWeapon from "../CharizardWeapon";
import MBLevel from "../../Scenes/MBLevel";
export default class BlitzState extends PlayerState {

    // ── Tuning ────────────────────────────────────────────────────
    /** How long Blitz owns the physics before handing back to Jump/Fall */
    private static readonly DURATION:      number = 0.3;
    /** Gravity fraction during blitz arc — lower = floatier */
    private static readonly GRAVITY_MULT:  number = 0.7;
    /** How much pre-existing velocity carries into the launch */
    private static readonly MOMENTUM_CARRY: number = 0.2;

    // ── Runtime ───────────────────────────────────────────────────
    private timer:     number = 0;
    private launchDir: Vec2   = Vec2.ZERO;

    public onEnter(_options: Record<string, any>): void {
        this.timer = BlitzState.DURATION;
        
        const scene       = this.owner.getScene() as MBLevel;
        const playerPos   = this.owner.position;
        const explosionOrigin = Input.getGlobalMousePosition(); 

        // Probe all nearby solid surfaces

        const result = CharizardWeapon.probeNearestSurface(
            this.owner.position,
            scene.getWalls(),
            scene.getDestructable(),
             explosionOrigin,
        );
        if (!result.hit) {
            this.finished(this.parent.velocity.y < 0 ? PlayerStates.JUMP : PlayerStates.FALL);
            return;
        }
        // Blend existing momentum with launch impulse
        const prev = this.parent.velocity;
        this.parent.velocity.x = result.impulse.x + prev.x * BlitzState.MOMENTUM_CARRY;
        this.parent.velocity.y = result.impulse.y + prev.y * BlitzState.MOMENTUM_CARRY;

        this.launchDir = new Vec2(this.parent.velocity.x, this.parent.velocity.y);
        if (this.launchDir.x !== 0) this.owner.invertX = this.launchDir.x < 0;

        this.owner.animation.play(PlayerAnimations.CHARIZARD_BLITZ, false);
    }

    public update(deltaT: number): void {
        super.update(deltaT);

        this.timer -= deltaT;

        this.parent.velocity.y +=
            this.parent.effectiveGravity * BlitzState.GRAVITY_MULT * deltaT;

        this.owner.move(this.parent.velocity.scaled(deltaT));

        if (this.launchDir.x !== 0) {
            this.owner.invertX = this.launchDir.x < 0;
        }

        if (this.owner.onGround) {
            this.finished(PlayerStates.IDLE);
            return;
        }

        if (this.timer <= 0) {
            this.finished(
                this.parent.velocity.y < 0 ? PlayerStates.JUMP : PlayerStates.FALL
            );
        }
    }

    public onExit(): Record<string, any> {
        return {};
    }
}