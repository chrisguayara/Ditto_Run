import Input from "../../../Wolfie2D/Input/Input";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import { PlayerAnimations, PlayerStates } from "../PlayerController";
import PlayerState from "./PlayerState";
import { MBEvents } from "../../MBEvents";
import { MBControls } from "../../MBControls";
import Enemy from "../../Entity/Enemy";
import MBLevel from "../../Scenes/MBLevel";
/*
 * ROCKET_JUMP (true):  Launch OPPOSITE the click direction — like a rocket jump.
 *                      Great for vertical/diagonal escape and momentum chaining.
 *
 * FLARE_BLITZ (false): Launch TOWARD the click direction — charge dash.
 *                      Great for horizontal rushes and aggressive movement.
 *
 */
export default class BlitzState extends PlayerState {

    // togglable either rocket jump or flare blitz
    private static readonly ROCKET_JUMP_MODE: boolean = true;

    // ── Tuning ────────────────────────────────────────────────────
    private static readonly DURATION:          number = 0.70;   // seconds blitz owns physics
    private static readonly LAUNCH_SPEED:      number = 300;    // base launch magnitude
    private static readonly MOMENTUM_CARRY:    number = 0.70;    // how much existing velocity blends in
    private static readonly HORIZONTAL_BIAS:   number = 1.3;    // multiply x component — makes it feel fast
    private static readonly VERTICAL_BIAS:     number = 0.85;   // slightly reduce y — keeps it readable
    private static readonly GRAVITY_MULT:      number = 0.4;    // reduced gravity during blitz arc

    // ── Runtime state ─────────────────────────────────────────────
    private timer:     number = 0;
    private launched:  boolean = false;
    private launchDir: Vec2 = Vec2.ZERO;


    public onEnter(_options: Record<string, any>): void {
        this.timer    = BlitzState.DURATION;
        this.launched = false;

        const mousePos = Input.getGlobalMousePosition();
        const origin   = this.owner.position;

        // Direction from player to mouse
        const dx  = mousePos.x - origin.x;
        const dy  = mousePos.y - origin.y;
        const len = Math.hypot(dx, dy);
        if (len < 1) {
            // No meaningful direction — abort, fall through
            this.finished(PlayerStates.FALL);
            return;
        }

        // Unit vector toward mouse
        const towardX = dx / len;
        const towardY = dy / len;

        let launchX: number;
        let launchY: number;

        if (BlitzState.ROCKET_JUMP_MODE) {
            launchX = -towardX * BlitzState.LAUNCH_SPEED * BlitzState.HORIZONTAL_BIAS;
            launchY = -towardY * BlitzState.LAUNCH_SPEED * BlitzState.VERTICAL_BIAS;
        } else {
            launchX = towardX * BlitzState.LAUNCH_SPEED * BlitzState.HORIZONTAL_BIAS;
            launchY = towardY * BlitzState.LAUNCH_SPEED * BlitzState.VERTICAL_BIAS;
        }

        // Blend with existing momentum — carry forward speed from grapple/run
        const prevVx = this.parent.velocity.x;
        const prevVy = this.parent.velocity.y;

        // If previous velocity aligns with launch direction, amplify it
        // If it opposes, blend less aggressively
        const dotX = prevVx * launchX > 0 ? BlitzState.MOMENTUM_CARRY : BlitzState.MOMENTUM_CARRY * 0.3;
        const dotY = prevVy * launchY > 0 ? BlitzState.MOMENTUM_CARRY : BlitzState.MOMENTUM_CARRY * 0.3;

        this.parent.velocity.x = launchX + prevVx * dotX;
        this.parent.velocity.y = launchY + prevVy * dotY;

        // Store for reference
        this.launchDir = new Vec2(launchX, launchY);
        this.launched  = true;

        // Face the horizontal launch direction
        if (launchX !== 0) {
            this.owner.invertX = launchX < 0;
        }

        this.owner.animation.play(PlayerAnimations.CHARIZARD_BLITZ, false);
    }

    public update(deltaT: number): void {
        super.update(deltaT);

        this.timer -= deltaT;

        // Reduced gravity during blitz for a floatier arc
        this.parent.velocity.y += this.parent.effectiveGravity * BlitzState.GRAVITY_MULT * deltaT;

        this.owner.move(this.parent.velocity.scaled(deltaT));

        // Keep facing launch direction during blitz
        if (this.launchDir.x !== 0) {
            this.owner.invertX = this.launchDir.x < 0;
        }

        // Land early
        if (this.owner.onGround) {
            this.finished(PlayerStates.IDLE);
            return;
        }

        // Duration expired — hand off to JUMP or FALL based on vertical velocity
        if (this.timer <= 0) {
            this.finished(
                this.parent.velocity.y < 0 ? PlayerStates.JUMP : PlayerStates.FALL
            );
        }

        const scene = this.owner.getScene() as MBLevel;

        // Hit entities (enemies) in blitz path
        scene.getEntityMap().forEach((entity, id) => {
            if (!(entity instanceof Enemy) || entity.isFainted) return;
            const dist = Math.hypot(
                this.owner.position.x - entity.position.x,
                this.owner.position.y - entity.position.y
            );
            if (dist < 20) {
                entity.onHit(2); // blitz does 2 damage
            }
        });

        // Break destructible tiles under the blitz path
        const destructable = scene.getDestructable();
        if (destructable) {
            const pos = this.owner.position;
            const tileSize = destructable.getTileSize();
            const col = Math.floor(pos.x / tileSize.x);
            const row = Math.floor(pos.y / tileSize.y);
            // Check a small radius of tiles
            for (let dc = -1; dc <= 1; dc++) {
                for (let dr = -1; dr <= 1; dr++) {
                    if (destructable.isTileCollidable(col + dc, row + dr)) {
                        destructable.setTileAtRowCol(new Vec2(col + dc, row + dr), 0);
                    }
                }
            }
        }
    }

    public onExit(): Record<string, any> {
        // Velocity is preserved — JUMP/FALL/IDLE will carry the momentum forward
        return {};
    }
}