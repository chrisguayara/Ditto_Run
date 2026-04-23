// src/master-blaster/Entities/Snorlax.ts
import Entity from "../Entity";
import { MBEvents } from "../../MBEvents";

export default class Snorlax extends Entity {
    public static readonly SPRITE_KEY = "Snorlax";
    public static readonly SPRITE_PATH = "game_assets/spritesheets/entities/snorlax.json";
    private readonly BOUNCE_FORCE = -600; 

    public onPlayerContact(): void {
        if (this.consumed) return; 
        this.emitter.fireEvent(MBEvents.PLAYER_BOUNCE, { force: this.BOUNCE_FORCE });
    }
}