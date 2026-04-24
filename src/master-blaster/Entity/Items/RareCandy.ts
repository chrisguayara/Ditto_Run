// src/master-blaster/Entity/Items/RareCandy.ts
import Consumable from "./Consumable";
import { MBEvents } from "../../MBEvents";
import { MBPhysicsGroups } from "../../MBPhysicsGroups";

export default class RareCandy extends Consumable {
    public static readonly SPRITE_KEY  = "RareCandy";
    public static readonly SPRITE_PATH = "game_assets/spritesheets/entities/rarecandy.json";

    private readonly HEAL_AMOUNT     = 3;
    private readonly ENERGY_AMOUNT   = 0.25;
    private readonly RESPAWN_TIME    = 30;    // seconds, not ms
    private readonly BOB_SPEED       = 2.0;
    private readonly BOB_AMPLITUDE   = 2.0;

    private respawnTimer: number  = 0;
    private bobTimer: number      = 0;
    private baseY: number         = 0;
    private initialized: boolean  = false;

    // Override consume() — just mark as consumed and hide/disable
    // Do NOT also call onConsume effects here
    protected consume(): void {
        this.consumed = true;
        this.sprite.alpha = 0;
        this.sprite.setGroup("");          // disable collision
        this.respawnTimer = this.RESPAWN_TIME;
    }

    // Apply the actual gameplay effect
    public onConsume(): void {
        this.emitter.fireEvent(MBEvents.PLAYER_HEAL, {
            amount: this.HEAL_AMOUNT
        });
        this.emitter.fireEvent(MBEvents.PLAYER_ENERGY_RESTORE, {
            amount: this.ENERGY_AMOUNT
        });
    }

    private respawn(): void {
        this.consumed = false;
        this.sprite.alpha = 1;
        this.sprite.setGroup(MBPhysicsGroups.ENTITY);
        // Re-register the trigger so the player can pick it up again
        this.sprite.setTrigger(MBPhysicsGroups.PLAYER, MBEvents.PLAYER_HIT_ENTITY, "");
    }

    public update(deltaT: number): void {
        if (!this.initialized) {
            this.baseY = this.sprite.position.y;
            this.initialized = true;
        }

        if (this.consumed) {
            this.respawnTimer -= deltaT;        // deltaT is in seconds
            if (this.respawnTimer <= 0) {
                this.respawn();
            }
            return;                             // skip bobbing while consumed
        }

        // Bob only when visible
        this.bobTimer += deltaT * this.BOB_SPEED;
        this.sprite.position.y = this.baseY + Math.sin(this.bobTimer) * this.BOB_AMPLITUDE;
    }
}