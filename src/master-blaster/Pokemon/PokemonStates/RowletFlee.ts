import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import MBAnimatedSprite from "../../Nodes/MBAnimatedSprite";
import PokemonController from "../PokemonController";
import { PokemonStates, PokemonAnimations } from "../PokemonController";
import PokemonState from "./PokemonState";

const enum FleePhase {
    /** Airborne - moving away from the player */
    LEAPING,
    /** Briefly on the ground before the next jump */
    LANDED,
}

export default class RowletFlee extends PokemonState {

    // ── Tuning ─────────────────────────────────────────────────────
    /** px/s horizontal speed while fleeing */
    private static readonly FLEE_SPEED:   number = 130;
    /** Initial upward velocity for each leap */
    private static readonly JUMP_FORCE:   number = -220;
    /** Seconds to wait on the ground before jumping again */
    private static readonly LAND_PAUSE:   number = 0.18;
    /** Maximum number of leaps before returning to Patrol */
    private static readonly MAX_LEAPS:    number = 3;

    // ── Runtime state ──────────────────────────────────────────────
    private phase:      FleePhase = FleePhase.LEAPING;
    private leapsDone:  number    = 0;
    private landTimer:  number    = 0;
    /** Horizontal direction away from the player: -1 or 1 */
    private fleeDir:    number    = 1;

    public constructor(parent: PokemonController, owner: MBAnimatedSprite) {
        super(parent, owner);
    }

    // ── Lifecycle ──────────────────────────────────────────────────
    public onEnter(options: Record<string, any>): void {
        this.leapsDone = 0;
        this.landTimer = 0;
        this.startLeap();
        console.log("RowletFlee onEnter", {
            playerPos: this.parent.playerRef.position,
            rowletPos: this.owner.position,
            fleeDir: this.fleeDir,
            phase: this.phase
        });
    }

    public update(deltaT: number): void {
        super.update(deltaT);

        console.log("RowletFlee update", {
            phase: this.phase,
            rowletPos: this.owner.position,
            playerPos: this.parent.playerRef.position,
            vel: this.parent.velocity,
            onGround: this.owner.onGround
        });

        switch (this.phase) {
            case FleePhase.LEAPING:  this.updateLeaping(deltaT);  break;
            case FleePhase.LANDED:   this.updateLanded(deltaT);   break;
        }
    }

    public onExit(): Record<string, any> {
        this.parent.velocity.x = 0;
        this.parent.velocity.y = 0;
        this.owner.animation.stop();
        return {};
    }

    // ── Phase updates ──────────────────────────────────────────────
    private updateLeaping(deltaT: number): void {
        // Apply gravity (low because gravityMultiplier = 0.3)
        this.parent.velocity.y += this.gravity * deltaT;

        // Maintain horizontal flee direction
        this.parent.velocity.x = this.fleeDir * RowletFlee.FLEE_SPEED;

        this.owner.move(this.parent.velocity.scaled(deltaT));
        this.owner.invertX = this.fleeDir < 0;

        console.log("RowletFlee leaping", {
            fleeDir: this.fleeDir,
            velocity: this.parent.velocity,
            rowletPos: this.owner.position,
            playerPos: this.parent.playerRef.position,
            onGround: this.owner.onGround
        });

        // Switch between JUMP and FALL animations based on vertical direction
        if (this.parent.velocity.y < 0) {
            this.owner.animation.playIfNotAlready(PokemonAnimations.JUMP);
        } else {
            this.owner.animation.playIfNotAlready(PokemonAnimations.FALL);
        }

        // Landed on something solid
        if (this.owner.onGround) {
            console.log("RowletFlee landed", {
                leapsDone: this.leapsDone,
                rowletPos: this.owner.position,
                playerPos: this.parent.playerRef.position
            });
            this.leapsDone++;
            this.phase     = FleePhase.LANDED;
            this.landTimer = RowletFlee.LAND_PAUSE;
            this.parent.velocity.x = 0;
            this.parent.velocity.y = 0;
            this.owner.animation.play(PokemonAnimations.IDLE, true);
        }
    }

    private updateLanded(deltaT: number): void {
        this.landTimer -= deltaT;
        if (this.landTimer > 0) return;

        // Done fleeing — go back to patrol
        if (this.leapsDone >= RowletFlee.MAX_LEAPS) {
            this.finished(PokemonStates.PATROL);
            return;
        }

        // Re-evaluate flee direction each jump in case the player moved
        this.refreshFleeDir();
        this.startLeap();
    }

    // ── Helpers ───────────────────────────────────────────────────
    private startLeap(): void {
        this.refreshFleeDir();
        this.phase             = FleePhase.LEAPING;
        this.parent.velocity.x = this.fleeDir * RowletFlee.FLEE_SPEED;
        this.parent.velocity.y = RowletFlee.JUMP_FORCE;
        this.owner.animation.play(PokemonAnimations.JUMP, true);
    }

    /** Points fleeDir away from the player's current position */
    private refreshFleeDir(): void {
        const dx = this.owner.position.x - this.parent.playerRef.position.x;
        // If exactly on top of player, flee right by default
        this.fleeDir = dx >= 0 ? 1 : -1;
        console.log("RowletFlee refreshFleeDir", {
            dx,
            fleeDir: this.fleeDir,
            rowletPos: this.owner.position,
            playerPos: this.parent.playerRef.position
        });
    }
}