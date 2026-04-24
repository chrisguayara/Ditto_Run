import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import Input from "../../../Wolfie2D/Input/Input";
import Color from "../../../Wolfie2D/Utils/Color";
import Line from "../../../Wolfie2D/Nodes/Graphics/Line";
import { GraphicType } from "../../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import { PlayerAnimations, PlayerStates } from "../PlayerController";
import PlayerState from "./PlayerState";
import { MBLayers, MBLayer } from "../../Scenes/MBLevel";

const enum GrapplePhase { CASTING, ATTACHED, MISSED }

export default class GreninjaTongueGrapple extends PlayerState {

    // ── Tuning ────────────────────────────────────────────────────
    private static readonly CAST_SPEED:   number = 700;   // px/s tongue travel
    private static readonly MAX_RANGE:    number = 350;   // px
    private static readonly PULL_FORCE:   number = 600;   // px/s²
    private static readonly MAX_SPEED:    number = 450;   // px/s cap while attached
    private static readonly MISS_PAUSE:   number = 0.15;  // seconds before exiting on miss
    private static readonly DETACH_DIST:  number = 24;    // px — auto-detach near anchor
    private static readonly ATTACH_GRAV:  number = 0.5;   // gravity fraction while swinging

    // ── Tongue rendering ──────────────────────────────────────────
    private static readonly NUM_SEGMENTS: number = 7;
    /** Sine-wave amplitude as a fraction of total tongue length */
    private static readonly WAVE_SCALE:   number = 0.09;
    /** Hard cap on wave amplitude in px */
    private static readonly MAX_WAVE_AMP: number = 8;
    private static readonly TONGUE_LAYER: MBLayer = "PRIMARY";

    private static readonly TONGUE_COLOR: Color  = new Color(225,110,122);

    // ── Runtime state ─────────────────────────────────────────────
    private phase:       GrapplePhase = GrapplePhase.CASTING;
    private castDir:     Vec2         = new Vec2(0, -1);
    private anchor:      Vec2         = new Vec2(0, 0);
    private tipPos:      Vec2         = new Vec2(0, 0);
    private castDist:    number       = 0;
    private missTimer:   number       = 0;
    private tongueLines: Line[]       = [];

    // ── Lifecycle ─────────────────────────────────────────────────
    public onEnter(options: Record<string, any>): void {
        const origin = this.owner.position;
        const mouse  = Input.getGlobalMousePosition();

        // Snapshot direction toward cursor at the moment of click
        const dx  = mouse.x - origin.x;
        const dy  = mouse.y - origin.y;
        const len = Math.hypot(dx, dy);
        this.castDir  = len > 0 ? new Vec2(dx / len, dy / len) : new Vec2(0, -1);

        this.tipPos    = origin.clone();
        this.castDist  = 0;
        this.phase     = GrapplePhase.CASTING;
        this.missTimer = 0;

        this.parent.grappleAnchor = null;
        this.parent.grappleTip    = this.tipPos;

        this.createTongueLines();
        this.owner.animation.play(PlayerAnimations.JUMP);
    }

    public update(deltaT: number): void {
        super.update(deltaT);

        switch (this.phase) {
            case GrapplePhase.CASTING:  this.updateCasting(deltaT);  break;
            case GrapplePhase.ATTACHED: this.updateAttached(deltaT); break;
            case GrapplePhase.MISSED:   this.updateMissed(deltaT);   break;
        }

        this.parent.grappleTip = this.tipPos.clone();
        this.updateTongueLines();
    }

    public onExit(): Record<string, any> {
        this.owner.animation.stop();
        this.parent.grappleAnchor = null;
        this.parent.grappleTip    = null;
        this.destroyTongueLines();
        return {};
    }

    // ── Phase updates ─────────────────────────────────────────────

    private updateCasting(deltaT: number): void {
        // Tongue flies freely — no early cancel during cast
        const step = GreninjaTongueGrapple.CAST_SPEED * deltaT;
        this.castDist += step;
        this.tipPos.x += this.castDir.x * step;
        this.tipPos.y += this.castDir.y * step;

        // Player still falls while tongue is in flight
        this.parent.velocity.y += this.parent.effectiveGravity * deltaT;
        this.owner.move(this.parent.velocity.scaled(deltaT));

        // Hit a tile → attach
        if (this.hitsTile(this.tipPos)) {
            this.anchor               = this.tipPos.clone();
            this.parent.grappleAnchor = this.anchor;
            this.phase                = GrapplePhase.ATTACHED;
            return;
        }

        // Max range → miss
        if (this.castDist >= GreninjaTongueGrapple.MAX_RANGE) {
            this.phase     = GrapplePhase.MISSED;
            this.missTimer = GreninjaTongueGrapple.MISS_PAUSE;
        }
    }

    private updateAttached(deltaT: number): void {
        const px   = this.anchor.x - this.owner.position.x;
        const py   = this.anchor.y - this.owner.position.y;
        const dist = Math.hypot(px, py);

        // Auto-detach when close enough to anchor
        if (dist < GreninjaTongueGrapple.DETACH_DIST) {
            this.exit();
            return;
        }

        const nx = px / dist;
        const ny = py / dist;

        // Reduced gravity for a swingier feel
        this.parent.velocity.y += this.parent.effectiveGravity
                                 * GreninjaTongueGrapple.ATTACH_GRAV
                                 * deltaT;

        // Pull toward anchor
        this.parent.velocity.x += nx * GreninjaTongueGrapple.PULL_FORCE * deltaT;
        this.parent.velocity.y += ny * GreninjaTongueGrapple.PULL_FORCE * deltaT;

        // Let player steer laterally for swing control
        const inputDir = this.parent.inputDir;
        this.parent.velocity.x += inputDir.x * this.parent.effectiveSpeed * 0.25;

        // Speed cap
        const spd = Math.hypot(this.parent.velocity.x, this.parent.velocity.y);
        if (spd > GreninjaTongueGrapple.MAX_SPEED) {
            const scale = GreninjaTongueGrapple.MAX_SPEED / spd;
            this.parent.velocity.x *= scale;
            this.parent.velocity.y *= scale;
        }

        this.owner.move(this.parent.velocity.scaled(deltaT));
        this.tipPos = this.anchor.clone(); // tongue tip stays pinned to anchor

        // Detach conditions:
        if (this.owner.onGround)          { this.exit(); return; }
        if (Input.isMouseJustPressed())   { this.exit(); return; } // second click detaches

        if (!this.parent.isTransforming) {
            this.owner.animation.playIfNotAlready(PlayerAnimations.IDLE);
        }
    }

    private updateMissed(deltaT: number): void {
        // Retract tip back toward player during the pause so the miss looks intentional
        const t = Math.min(1, deltaT * 10);
        this.tipPos.x += (this.owner.position.x - this.tipPos.x) * t;
        this.tipPos.y += (this.owner.position.y - this.tipPos.y) * t;

        this.missTimer -= deltaT;
        if (this.missTimer <= 0) this.exit();
    }

    // ── Tongue rendering ──────────────────────────────────────────

    /**
     * Creates NUM_SEGMENTS Line nodes on the scene.
     *  Two things to verify against Wolfie2D 
     *   1. scene.add.graphic(GraphicType.LINE, layer, {}) — adjust if the API differs
     *   2. TONGUE_LAYER — must match an actual layer in MBLevel
     */
    private createTongueLines(): void {
        const scene = this.owner.getScene();
        const N     = GreninjaTongueGrapple.NUM_SEGMENTS;
        this.tongueLines = [];

        for (let i = 0; i < N; i++) {
            const line = scene.add.graphic(
                GraphicType.LINE,
                GreninjaTongueGrapple.TONGUE_LAYER,
                {
                    start: new Vec2(0, 0),
                    end: new Vec2(0, 0)
                }
            ) as Line;

            line.color = GreninjaTongueGrapple.TONGUE_COLOR;

            // Taper: thick at mouth (i=0), thin at tip (i=N-1)
            line.thickness = Math.max(1, 3.5 - (i / (N - 1)) * 2.5);

            this.tongueLines.push(line);
        }
    }

    /**
     * Repositions the N Line nodes in a sine-wave arc each frame.
     *
     * The wave has zero offset at both ends (mouth and tip) and peaks
     * in the middle — gives the tongue a natural bowed shape.
     */
    private updateTongueLines(): void {
        const start = this.owner.position;
        const end   = this.tipPos;
        const N     = this.tongueLines.length;
        if (N === 0) return;

        const dx       = end.x - start.x;
        const dy       = end.y - start.y;
        const totalLen = Math.hypot(dx, dy);

        // Unit vectors: along tongue direction (u) and perpendicular (p)
        const ux = totalLen > 0 ? dx / totalLen : 0;
        const uy = totalLen > 0 ? dy / totalLen : 0;
        const perpX = -uy;   // rotate 90°
        const perpY =  ux;

        const waveAmp = Math.min(
            totalLen * GreninjaTongueGrapple.WAVE_SCALE,
            GreninjaTongueGrapple.MAX_WAVE_AMP
        );

        for (let i = 0; i < N; i++) {
            const t0 = i / N;
            const t1 = (i + 1) / N;

            // sin(t * π) → 0 at both ends, 1 in the middle
            const off0 = Math.sin(t0 * Math.PI) * waveAmp;
            const off1 = Math.sin(t1 * Math.PI) * waveAmp;

            this.tongueLines[i].start = new Vec2(
                start.x + dx * t0 + perpX * off0,
                start.y + dy * t0 + perpY * off0
            );
            this.tongueLines[i].end = new Vec2(
                start.x + dx * t1 + perpX * off1,
                start.y + dy * t1 + perpY * off1
            );
        }
    }

    private destroyTongueLines(): void {
        const scene = this.owner.getScene();
        for (const line of this.tongueLines) {
            scene.remove(line);
        }
        this.tongueLines = [];
    }

    // ── Helpers ───────────────────────────────────────────────────

    private exit(): void {
        this.finished(this.owner.onGround ? PlayerStates.IDLE : PlayerStates.FALL);
    }

    /**
     * Verify getTileAtWorldPosition exists on OrthogonalTilemap.
     * Alternatives: getTileAtRowCol, isTileCollidable, etc.
     */
    private hitsTile(pos: Vec2): boolean {
        try {
            const tile = this.parent.tilemap.getTileAtWorldPosition(pos);
            return tile > 0;
        } catch {
            return false;
        }
    }
}