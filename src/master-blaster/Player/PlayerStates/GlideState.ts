import Input from "../../../Wolfie2D/Input/Input";
import { PlayerStates } from "../PlayerController";
import PlayerState from "./PlayerState";
import MBAnimatedSprite from "../../Nodes/MBAnimatedSprite";
import PlayerController from "../PlayerController";
import { MBControls } from "../../MBControls";

/**
 * GlideState
 * ──────────
 * Entered from Jump or Fall when Charizard is active and W is held.
 *
 * Reduces gravity to a gentle drift and caps fall speed.
 * Exits to:
 *   IDLE  — player lands
 *   FALL  — W released
 *   BLITZ — player left-clicks while gliding
 *
 * Entry guard (add to Jump.update and Fall.update — see INTEGRATION.md):
 *   Charizard + W held + velocity.y > GLIDE_ENTRY_VY → finished(GLIDE)
 */
export default class GlideState extends PlayerState {

    // ── Tuning ────────────────────────────────────────────────────

    /** Gravity applied per second while gliding (normal 500). */
    private static readonly GLIDE_GRAVITY   = 250;

    /** Hard cap on downward velocity (px/s) during glide. */
    private static readonly GLIDE_FALL_CAP  = 40;

    /**
     * The player's upward velocity must be below this (i.e., rising slower
     * than 120 px/s) before glide can be entered from Jump.
     * Prevents glide from killing a fresh rocket-jump arc immediately.
     * Public so Jump.ts can import it without magic literals.
     */
    public static readonly GLIDE_ENTRY_VY = -120;

    // ── Lifecycle ─────────────────────────────────────────────────

    public onEnter(_options: Record<string, any>): void {
        // Uses CHARIZARD_IDLE during glide — swap for a dedicated animation
        // key here once the art is ready.
        this.owner.animation.playIfNotAlready(
            this.parent.getAnimationKey("IDLE"), true
        );
    }

    public update(deltaT: number): void {
        super.update(deltaT);

        // ── Exit: landed ──────────────────────────────────────────
        if (this.owner.onGround) {
            this.finished(PlayerStates.IDLE);
            return;
        }

        // ── Exit: W released → normal fall ───────────────────────
        if (!Input.isPressed(MBControls.JUMP)) {
            this.finished(PlayerStates.FALL);
            return;
        }

        // ── Exit: click → blitz ───────────────────────────────────
        if (Input.isMouseJustPressed()) {
            this.finished(PlayerStates.BLITZ);
            return;
        }

        // ── Reduced gravity ───────────────────────────────────────
        this.parent.velocity.y += GlideState.GLIDE_GRAVITY * deltaT;
        if (this.parent.velocity.y > GlideState.GLIDE_FALL_CAP) {
            this.parent.velocity.y = GlideState.GLIDE_FALL_CAP;
        }

        // ── Horizontal control ────────────────────────────────────
        const dir = this.parent.inputDir;
        if (dir.x !== 0) {
            this.owner.invertX = dir.x < 0;
            this.parent.velocity.x += dir.x * this.parent.effectiveSpeed * 0.85 * deltaT;
        } else {
            // Gentle air friction
            this.parent.velocity.x *= 1 - (1.5 * deltaT);
            if (Math.abs(this.parent.velocity.x) < 3) this.parent.velocity.x = 0;
        }

        // Speed cap
        const maxX = this.parent.effectiveSpeed;
        if (Math.abs(this.parent.velocity.x) > maxX) {
            this.parent.velocity.x = Math.sign(this.parent.velocity.x) * maxX;
        }

        this.owner.move(this.parent.velocity.scaled(deltaT));

        this.owner.animation.playIfNotAlready(
            this.parent.getAnimationKey("IDLE"), true
        );
    }

    public onExit(): Record<string, any> {
        return {};
    }
}