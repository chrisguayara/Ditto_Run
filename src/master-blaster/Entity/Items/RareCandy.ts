import Item from "./Item";
import MBAnimatedSprite from "../../Nodes/MBAnimatedSprite";
import { MBEvents } from "../../MBEvents";

export default class RareCandy extends Item {
    public static readonly SPRITE_KEY  = "RARE_CANDY";
    public static readonly SPRITE_PATH = "game_assets/spritesheets/entities/rarecandy.json";

    protected applyEffect(): void {
        // Heal 1 heart
        this.emitter.fireEvent(MBEvents.PLAYER_HEAL, { amount: 1 });
        // Speed boost
        this.emitter.fireEvent(MBEvents.PLAYER_SPEED_BOOST, {
            multiplier: 2.2,
            duration: 1.3
        });
    }
}