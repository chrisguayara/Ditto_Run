// src/mb/Player/PlayerStates/FireSlam.ts
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import Input from "../../../Wolfie2D/Input/Input";
import { PlayerAnimations, PlayerStates } from "../PlayerController";
import PlayerState from "./PlayerState";
import { MBControls } from "../../MBControls";
import Enemy from "../../Entity/Enemy";
import MBLevel from "../../Scenes/MBLevel";
import Fall from "./Fall";

export default class FireSlam extends PlayerState {

    private static readonly SLAM_SPEED     = 500;  // px/s
    private static readonly ENEMY_HIT_DIST = 20;
    private static readonly BREAK_RADIUS   = 1;    // shockwave on landing

    private lockedX:   number  = 0;
    private hasLanded: boolean = false;

    public onEnter(_options: Record<string, any>): void {
        this.lockedX   = this.owner.position.x;
        this.hasLanded = false;
        this.parent.velocity.x = 0;
        this.parent.velocity.y = FireSlam.SLAM_SPEED;
        this.owner.animation.play(PlayerAnimations.CHARIZARD_BLITZ, false);
    }

    public update(deltaT: number): void {
        super.update(deltaT);
        if (this.hasLanded) return;

        const scene = this.owner.getScene() as MBLevel;
        const destructable = scene.getDestructable();
        const walls = scene.getWalls();

        // How far we want to move this frame
        const stepY = FireSlam.SLAM_SPEED * deltaT;

        // Break any destructable tiles along the path BEFORE moving
        // so they don't block us
        if (destructable) {
            const tileSize = destructable.getTileSize();
            // Sample several points along the downward path this frame
            const steps = Math.ceil(stepY / (tileSize.y * 0.5));
            for (let s = 0; s <= steps; s++) {
                const probeY = this.owner.position.y + (stepY * s / steps);
                const col = Math.floor(this.lockedX / tileSize.x);
                // Check at feet level
                const rowFeet = Math.floor((probeY + 8) / tileSize.y);
                // Also check the tile the body is in
                const rowBody = Math.floor(probeY / tileSize.y);

                for (let dc = -1; dc <= 1; dc++) {
                    if (destructable.isTileCollidable(col + dc, rowFeet)) {
                        destructable.setTileAtRowCol(new Vec2(col + dc, rowFeet), 0);
                    }
                    if (destructable.isTileCollidable(col + dc, rowBody)) {
                        destructable.setTileAtRowCol(new Vec2(col + dc, rowBody), 0);
                    }
                }
            }
        }

        // Now do the physics move — tiles along path are already cleared
        this.parent.velocity.x = 0;
        this.parent.velocity.y = FireSlam.SLAM_SPEED;
        this.owner.move(this.parent.velocity.scaled(deltaT));

        // Lock X drift
        this.owner.position.x = this.lockedX;

        // Hit enemies
        scene.getEntityMap().forEach((entity) => {
            if (!(entity instanceof Enemy) || entity.isFainted) return;
            const dist = Math.hypot(
                this.owner.position.x - entity.position.x,
                this.owner.position.y - entity.position.y
            );
            if (dist < FireSlam.ENEMY_HIT_DIST) {
                entity.onHit(2);
            }
        });

        if (Input.isJustPressed(MBControls.TRANSFORM)) {this.finished(PlayerStates.FALL);}
        if (this.owner.onGround) {
            this.hasLanded = true;

            // Shockwave — break tiles around landing point
            if (destructable) {
                const tileSize = destructable.getTileSize();
                const col = Math.floor(this.lockedX / tileSize.x);
                const row = Math.floor((this.owner.position.y + 8) / tileSize.y);
                const r = FireSlam.BREAK_RADIUS;
                for (let dc = -r; dc <= r; dc++) {
                    for (let dr = 0; dr <= r; dr++) {
                        if (destructable.isTileCollidable(col + dc, row + dr)) {
                            destructable.setTileAtRowCol(new Vec2(col + dc, row + dr), 0);
                        }
                    }
                }
            }

            this.parent.velocity.x = 0;
            this.parent.velocity.y = 0;
            this.finished(PlayerStates.IDLE);
        }
    }

    public onExit(): Record<string, any> {
        this.owner.rotation = 0;
        return {};
    }
}