import Item from "./Item";
import MBAnimatedSprite from "../../Nodes/MBAnimatedSprite";
import { MBEvents } from "../../MBEvents";

export default class ShieldCandy extends Item {
    public static readonly SPRITE_KEY  = "SHIELD_CANDY";
    public static readonly SPRITE_PATH = "game_assets/spritesheets/shieldcandy.json";

    protected applyEffect(): void {
        this.emitter.fireEvent(MBEvents.PLAYER_BUBBLE, { hits: 1 });
    }
}