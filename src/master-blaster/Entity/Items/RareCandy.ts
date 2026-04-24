// src/master-blaster/Entities/RareCandy.ts
import Entity from "../Entity";
import { MBEvents } from "../../MBEvents";
import { MBPhysicsGroups } from "../../MBPhysicsGroups";

export default class RareCandy extends Entity {
    public static readonly SPRITE_KEY  = "RareCandy";
    public static readonly SPRITE_PATH = "game_assets/spritesheets/entities/rarecandy.json";

    private readonly HEAL_AMOUNT   = 3;
    private readonly ENERGY_AMOUNT = 0.25;
    private readonly RESPAWN_TIME  = 300;       // 30 seconds
    private readonly BOB_SPEED     = 2.0;      // radians/sec
    private readonly BOB_AMPLITUDE = 2.0;      // pixels
    private readonly GHOST_ALPHA   = 0.25;     // opacity while on cooldown

    private respawnTimer: number  = 0;
    private bobTimer: number      = 0;
    private baseY: number         = 0;
    private initialized: boolean  = false;

    public onPlayerContact(): void {
        if (this.consumed) return;

        // TODO: play pickup sound here
        // this.emitter.fireEvent(GameEventType.PLAY_SOUND, { key: RareCandy.PICKUP_AUDIO_KEY });

        this.emitter.fireEvent(MBEvents.PLAYER_HEAL,          { amount: this.HEAL_AMOUNT });
        this.emitter.fireEvent(MBEvents.PLAYER_ENERGY_RESTORE, { amount: this.ENERGY_AMOUNT });

        this.consume();
    }

    private consume(): void {
        this.consumed      = true;
        this.respawnTimer  = this.RESPAWN_TIME;

        // Show greyed-out ghost so the player knows it's coming back
        this.sprite.alpha  = this.GHOST_ALPHA;
        this.sprite.setGroup(""); // remove from physics so no more triggers
    }

    private respawn(): void {
        this.consumed = false;

        this.sprite.alpha = 1;
        this.sprite.setGroup(MBPhysicsGroups.ENTITY);
        this.sprite.setTrigger(MBPhysicsGroups.PLAYER, MBEvents.PLAYER_HIT_ENTITY, "");
    }

    public update(deltaT: number): void {
        // Grab the base Y on the first frame so the bob is relative to spawn position
        if (!this.initialized) {
            this.baseY       = this.sprite.position.y;
            this.initialized = true;
        }

        // Respawn countdown
        if (this.consumed) {
            this.respawnTimer -= deltaT;
            if (this.respawnTimer <= 0) {
                this.respawn();
            }
        }

        // Bob - runs whether consumed or not so the ghost also bobs
        this.bobTimer += deltaT * this.BOB_SPEED;
        this.sprite.position.y = this.baseY + Math.sin(this.bobTimer) * this.BOB_AMPLITUDE;
    }
}