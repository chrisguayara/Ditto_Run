import Input from "../../../Wolfie2D/Input/Input";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import { PlayerAnimations, PlayerStates } from "../PlayerController";
import PlayerState from "./PlayerState";
import { MBControls } from "../../MBControls";
import Enemy from "../../Entity/Enemy";
import MBLevel from "../../Scenes/MBLevel";

export default class BlitzState extends PlayerState {

    private static readonly ROCKET_JUMP_MODE: boolean = true;

    private static readonly DURATION:        number = 0.70;
    private static readonly LAUNCH_SPEED:    number = 300;
    private static readonly MOMENTUM_CARRY:  number = 0.70;
    private static readonly HORIZONTAL_BIAS: number = 1.3;
    private static readonly VERTICAL_BIAS:   number = 0.85;
    private static readonly GRAVITY_MULT:    number = 0.4;

    private timer:       number = 0;
    private launched:    boolean = false;
    private launchDir:   Vec2 = Vec2.ZERO;
    private launchAngle: number = 0;

    public onEnter(_options: Record<string, any>): void {
        this.timer    = BlitzState.DURATION;
        this.launched = false;

        this.parent.blitzCooldown = this.parent.BLITZ_COOLDOWN_TIME;

        const mousePos = Input.getGlobalMousePosition();
        const origin   = this.owner.position;
        const dx = mousePos.x - origin.x;
        const dy = mousePos.y - origin.y;
        const len = Math.hypot(dx, dy);
        if (len < 1) { this.finished(PlayerStates.FALL); return; }

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

        const prevVx = this.parent.velocity.x;
        const prevVy = this.parent.velocity.y;
        const dotX = prevVx * launchX > 0 ? BlitzState.MOMENTUM_CARRY : BlitzState.MOMENTUM_CARRY * 0.3;
        const dotY = prevVy * launchY > 0 ? BlitzState.MOMENTUM_CARRY : BlitzState.MOMENTUM_CARRY * 0.3;

        this.parent.velocity.x = launchX + prevVx * dotX;
        this.parent.velocity.y = launchY + prevVy * dotY;

        this.launchDir   = new Vec2(launchX, launchY);
        this.launchAngle = Math.atan2(launchY, launchX);
        this.launched    = true;

        if (launchX !== 0) this.owner.invertX = launchX < 0;

        this.owner.rotation = this.launchAngle + (launchX < 0 ? Math.PI : 0);
        this.owner.animation.play(PlayerAnimations.CHARIZARD_BLITZ, false);
    }

    public update(deltaT: number): void {
        super.update(deltaT);
        this.timer -= deltaT;

        this.parent.velocity.y += this.parent.effectiveGravity * BlitzState.GRAVITY_MULT * deltaT;
        this.owner.move(this.parent.velocity.scaled(deltaT));

        const vx = this.parent.velocity.x;
        const vy = this.parent.velocity.y;
        if (Math.hypot(vx, vy) > 10) {
            const angle = Math.atan2(vy, vx);
            this.owner.rotation = this.owner.invertX ? angle + Math.PI : angle;
        }

        if (this.owner.onGround) {
            this.owner.rotation = 0;
            this.finished(PlayerStates.IDLE);
            return;
        }

        if (this.timer <= 0) {
            this.owner.rotation = 0;
            this.finished(this.parent.velocity.y < 0 ? PlayerStates.JUMP : PlayerStates.FALL);
            return;
        }

        const scene = this.owner.getScene() as MBLevel;

        scene.getEntityMap().forEach((entity) => {
            if (!(entity instanceof Enemy) || entity.isFainted) return;
            const dist = Math.hypot(
                this.owner.position.x - entity.position.x,
                this.owner.position.y - entity.position.y
            );
            if (dist < 20) {
                entity.onHit(2);
            }
        });

        const destructable = scene.getDestructable();
        if (destructable) {
            const pos      = this.owner.position;
            const tileSize = destructable.getTileSize();
            const col      = Math.floor(pos.x / tileSize.x);
            const row      = Math.floor(pos.y / tileSize.y);
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
        this.owner.rotation = 0;
        return {};
    }
}