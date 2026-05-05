import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import Input from "../../../Wolfie2D/Input/Input";
import Color from "../../../Wolfie2D/Utils/Color";
import Line from "../../../Wolfie2D/Nodes/Graphics/Line";
import { GraphicType } from "../../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import { PlayerAnimations, PlayerStates } from "../PlayerController";
import PlayerState from "./PlayerState";
import { MBLayer } from "../../Scenes/MBLevel";
import { MBControls } from "../../MBControls";
import Fall from "./Fall";
import AABB from "../../../Wolfie2D/DataTypes/Shapes/AABB";

const enum GrapplePhase { CASTING, ATTACHED, MISSED }

export default class GreninjaTongueGrapple extends PlayerState {

    private static readonly CAST_SPEED = 700;
    private static readonly MAX_RANGE = 124;
    private static readonly MAX_SPEED = 490;
    private static readonly MISS_PAUSE = 0.15;
    private static readonly SWING_STEER = 0.2;

    private static readonly NUM_SEGMENTS = 7;
    private static readonly WAVE_SCALE = 0.09;
    private static readonly MAX_WAVE_AMP = 8;
    private static readonly TONGUE_LAYER: MBLayer = "PRIMARY";
    private static readonly TONGUE_COLOR: Color = new Color(225,110,122);

    private phase = GrapplePhase.CASTING;
    private castDir = new Vec2(0, -1);
    private anchor = new Vec2(0, 0);
    private tipPos = new Vec2(0, 0);
    private castDist = 0;
    private missTimer = 0;
    private tongueLines: Line[] = [];

    public onEnter(): void {
        const origin = this.owner.position;
        const mouse = Input.getGlobalMousePosition();

        const dx = mouse.x - origin.x;
        const dy = mouse.y - origin.y;
        const len = Math.hypot(dx, dy);

        this.castDir = len > 0 ? new Vec2(dx / len, dy / len) : new Vec2(0, -1);

        this.tipPos = origin.clone();
        this.castDist = 0;
        this.phase = GrapplePhase.CASTING;

        this.createTongueLines();
    }

    public update(deltaT: number): void {
        switch (this.phase) {
            case GrapplePhase.CASTING: this.updateCasting(deltaT); break;
            case GrapplePhase.ATTACHED: this.updateAttached(deltaT); break;
            case GrapplePhase.MISSED: this.updateMissed(deltaT); break;
        }

        this.parent.grappleTip = this.tipPos.clone();
        this.updateTongueLines();
    }

    public onExit(): Record<string, any> {
        this.parent.grappleAnchor = null;
        this.parent.grappleTip = null;
        this.destroyTongueLines();
        return {};
    }

    private updateCasting(deltaT: number): void {
        const totalStep = GreninjaTongueGrapple.CAST_SPEED * deltaT;
        const tileSize = 16;
        const subStepSize = tileSize * 0.5;
        const steps = Math.ceil(totalStep / subStepSize);
        const subStep = totalStep / steps;
    
        let hit = false;
        for (let s = 0; s < steps; s++) {
            this.castDist += subStep;
            this.tipPos.x += this.castDir.x * subStep;
            this.tipPos.y += this.castDir.y * subStep;
    
            if (this.hitsTile(this.tipPos)) {
                this.anchor = this.tipPos.clone();
                this.parent.grappleAnchor = this.anchor;
                this.phase = GrapplePhase.ATTACHED;
                this.parent.grappleCooldown = this.parent.GRAPPLE_COOLDOWN_TIME;
                hit = true;
                break;
            }
    
            if (this.castDist >= GreninjaTongueGrapple.MAX_RANGE) {
                this.phase = GrapplePhase.MISSED;
                this.missTimer = GreninjaTongueGrapple.MISS_PAUSE;
                this.parent.grappleCooldown = this.parent.GRAPPLE_COOLDOWN_TIME * 0.4;
                hit = true; // stop the loop
                break;
            }
        }
    
        // Player body still moves normally during cast — sweep covers it
        const bodyVel = this.parent.velocity.scaled(deltaT);
        this.parent.velocity.y += this.parent.effectiveGravity * deltaT;
        this.owner.sweptRect.sweep(bodyVel, this.owner.position.clone(), 
            (this.owner.collisionShape as AABB).halfSize);
        this.owner.move(bodyVel);
    }

    private updateAttached(deltaT: number): void {
        const px = this.anchor.x - this.owner.position.x;
        const py = this.anchor.y - this.owner.position.y;
        const dist = Math.hypot(px, py);
    
        if (dist < 4) { this.exit(); return; }
    
        const nx = px / dist;
        const ny = py / dist;
    
        // ── Gravity ──
        this.parent.velocity.y += this.parent.effectiveGravity * deltaT;
    
        // ── Remove inward velocity ──
        const vDotN = this.parent.velocity.x * nx + this.parent.velocity.y * ny;
        if (vDotN > 0) {
            this.parent.velocity.x -= vDotN * nx;
            this.parent.velocity.y -= vDotN * ny;
        }
    
        // ── Centripetal pull ──
        this.parent.velocity.x += nx * 80 * deltaT;
        this.parent.velocity.y += ny * 80 * deltaT;
    
        // ── Steering ──
        const inputDir = this.parent.inputDir;
        const lateralX = inputDir.x - inputDir.x * nx * nx;
        const lateralY = -inputDir.x * nx * ny;
        this.parent.velocity.x += lateralX * this.parent.effectiveSpeed * GreninjaTongueGrapple.SWING_STEER;
        this.parent.velocity.y += lateralY * this.parent.effectiveSpeed * GreninjaTongueGrapple.SWING_STEER;
    
        // ── Speed cap ──
        const spd = Math.hypot(this.parent.velocity.x, this.parent.velocity.y);
        if (spd > GreninjaTongueGrapple.MAX_SPEED) {
            const scale = GreninjaTongueGrapple.MAX_SPEED / spd;
            this.parent.velocity.x *= scale;
            this.parent.velocity.y *= scale;
        }
    
        // ── Ceiling tunnel prevention via tilemap probe ──
        // If we're moving upward, check a point slightly above the player's head.
        // If that point is already inside a tile, kill upward velocity and exit
        // before the engine ever gets a chance to tunnel through it.
        if (this.parent.velocity.y < 0) {
            const collider = this.owner.collisionShape as AABB;
            // Probe at head + a small margin so we catch it before contact
            const probeMargin = 2;
            const headY = this.owner.position.y - collider.halfSize.y - probeMargin;
            const probeCenter = new Vec2(this.owner.position.x, headY);
    
            // Also probe slightly left and right to catch corner cases
            const probeLeft  = new Vec2(this.owner.position.x - collider.halfSize.x * 0.5, headY);
            const probeRight = new Vec2(this.owner.position.x + collider.halfSize.x * 0.5, headY);
    
            if (this.hitsTile(probeCenter) || this.hitsTile(probeLeft) || this.hitsTile(probeRight)) {
                this.parent.velocity.y = 0;
                this.exit();
                return;
            }
        }
    
        // ── Move (unchanged from original — full speed, full feel) ──
        this.owner.move(this.parent.velocity.scaled(deltaT));
        this.tipPos = this.anchor.clone();
    
        // ── Rope length constraint ──
        const dx = this.owner.position.x - this.anchor.x;
        const dy = this.owner.position.y - this.anchor.y;
        const dist2 = Math.hypot(dx, dy);
        const maxLen = GreninjaTongueGrapple.MAX_RANGE;
    
        if (dist2 > maxLen) {
            const nx2 = dx / dist2;
            const ny2 = dy / dist2;
            const vDot = this.parent.velocity.x * nx2 + this.parent.velocity.y * ny2;
            if (vDot > 0) {
                this.parent.velocity.x -= vDot * nx2;
                this.parent.velocity.y -= vDot * ny2;
            }
            const epsilon = 0.5;
            this.owner.position.x = this.anchor.x + nx2 * (maxLen - epsilon);
            this.owner.position.y = this.anchor.y + ny2 * (maxLen - epsilon);
        }
    
        // ── Collision exits (engine flags, post-move) ──
        if (this.owner.onWall) {
            this.parent.velocity.x *= 0.5;
            this.exit();
            return;
        }
        if (this.owner.onCeiling) {
            this.parent.velocity.y = 0;
            this.exit();
            return;
        }
    
        // ── Inputs ──
        if (Input.isMouseJustPressed()) { this.exit(); return; }
        if (Input.isJustPressed(MBControls.JUMP)) {
            this.parent.velocity.y = Math.min(this.parent.velocity.y, -200);
            this.exit();
            return;
        }
        if (this.owner.onGround) { this.exit(); return; }
    }

    private updateMissed(deltaT: number): void {
        const t = Math.min(1, deltaT * 10);

        this.tipPos.x += (this.owner.position.x - this.tipPos.x) * t;
        this.tipPos.y += (this.owner.position.y - this.tipPos.y) * t;

        this.missTimer -= deltaT;
        if (this.missTimer <= 0) this.exit();
    }

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
            line.thickness = Math.max(8, 3.5 - (i / (N - 1)) * 2.5);

            this.tongueLines.push(line);
        }
    }

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

    private exit(): void {
        this.finished(this.owner.onGround ? PlayerStates.IDLE : PlayerStates.FALL);
        
    }

    private hitsTile(pos: Vec2): boolean {
        try {
            return this.parent.tilemap.getTileAtWorldPosition(pos) > 0;
        } catch {
            return false;
        }
    }
}