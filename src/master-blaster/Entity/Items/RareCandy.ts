// src/master-blaster/Entities/RareCandy.ts
import Entity from "../Entity";
import { MBEvents } from "../../MBEvents";

export default class RareCandy extends Entity {
    public static readonly SPRITE_KEY = "RareCandy";
    public static readonly SPRITE_PATH = "game_assets/spritesheets/entities/rarecandy.json";
    private readonly HEAL_AMOUNT = 5;

    public onPlayerContact(): void {
        if (this.consumed) return;
        this.emitter.fireEvent(MBEvents.PLAYER_HEAL, { amount: this.HEAL_AMOUNT });
        this.destroy();
    }
}