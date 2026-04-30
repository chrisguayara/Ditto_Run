import Input from "../../../Wolfie2D/Input/Input";
import { PlayerAnimations, PlayerStates } from "../PlayerController";
import PlayerState from "./PlayerState";
import MBAnimatedSprite from "../../Nodes/MBAnimatedSprite";
import PlayerController from "../PlayerController";
import CharizardWeapon, { CharizardAttackResult } from "../CharizardWeapon";
import { MBEvents } from "../../MBEvents";
import { MBControls } from "../../MBControls";

/**
 * BlitzState
 * ──────────
 * Entered whenever Charizard left-clicks (from Idle, Run, Jump, Fall, or Glide).
 *
 * onEnter:  runs the raycast, applies the correct impulse, fires events.
 * update:   handles physics for a brief flash duration, then exits to
 *           JUMP (if launched airborne) or FALL/IDLE (otherwise).
 */
export default class BlitzState extends PlayerState {

    // ── Tuning ────────────────────────────────────────────────────
    /** How long Blitz "owns" the player before handing off to JUMP/FALL. */
    private static readonly DURATION = 0.10; // seconds

    // ── Runtime state ─────────────────────────────────────────────
    private timer:    number  = 0;
    private launched: boolean = false;   // true → exit to JUMP, false → FALL/IDLE

    // ── Lifecycle ─────────────────────────────────────────────────

    public onEnter(_options: Record<string, any>): void {
        this.timer    = BlitzState.DURATION;
        this.launched = false;

        // ── Raycast ───────────────────────────────────────────────
        const scene        = this.parent.scene;
        const mouseWorldPos = Input.getGlobalMousePosition();

        const result = CharizardWeapon.processAttack(
            this.owner.position,
            mouseWorldPos,
            scene.getWalls(),
            scene.getDestructable(),
            scene.getPokemonOwners(),
        );

        // ── Apply result ──────────────────────────────────────────
        switch (result.result) {

            case CharizardAttackResult.ROCKET_JUMP:
                // Replace velocity entirely — this is a launch, not a nudge.
                this.parent.velocity.x = result.impulse.x;
                this.parent.velocity.y = result.impulse.y;
                this.launched = true;
                break;

            case CharizardAttackResult.WALL_LAUNCH:
                this.parent.velocity.x = result.impulse.x;
                this.parent.velocity.y = result.impulse.y;
                this.launched = true;
                // Face the direction we're being launched
                if (result.impulse.x !== 0) {
                    this.owner.invertX = result.impulse.x < 0;
                }
                break;

            case CharizardAttackResult.HIT_ENTITY:
                if (result.entityId != null) {
                    this.emitter.fireEvent(MBEvents.POKEMON_HIT, {
                        node:  result.entityId,
                        other: result.entityId,
                    });
                }
                // Add a small rebound so the hit feels physical
                this.parent.velocity.x += result.impulse.x;
                this.parent.velocity.y += result.impulse.y;
                break;

            case CharizardAttackResult.MISS:
                // No physics change — animation still plays
                break;
        }

        this.owner.animation.play(PlayerAnimations.CHARIZARD_BLITZ, false);
    }

    public update(deltaT: number): void {
        super.update(deltaT);

        this.timer -= deltaT;

        // ── Physics (own it during the flash so the launch feels snappy) ──
        this.parent.velocity.y += this.parent.effectiveGravity * deltaT;
        this.owner.move(this.parent.velocity.scaled(deltaT));

        // ── Horizontal facing ─────────────────────────────────────
        if (this.parent.inputDir.x !== 0) {
            this.owner.invertX = this.parent.inputDir.x < 0;
        }

        // ── Early-exit on landing ─────────────────────────────────
        if (this.owner.onGround) {
            this.finished(PlayerStates.IDLE);
            return;
        }

        // ── Exit after duration ───────────────────────────────────
        if (this.timer <= 0) {
            if (this.launched) {
                // Let JUMP / FALL handle the rest of the arc
                this.finished(
                    this.parent.velocity.y < 0 ? PlayerStates.JUMP : PlayerStates.FALL
                );
            } else {
                this.finished(PlayerStates.FALL);
            }
        }
    }

    public onExit(): Record<string, any> {
        return {};
    }
}