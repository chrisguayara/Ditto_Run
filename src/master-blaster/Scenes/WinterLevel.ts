import AABB from "../../Wolfie2D/DataTypes/Shapes/AABB";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import MBLevel from "./MBLevel";
import RenderingManager from "../../Wolfie2D/Rendering/RenderingManager";
import SceneManager from "../../Wolfie2D/Scene/SceneManager";
import Viewport from "../../Wolfie2D/SceneGraph/Viewport";
import PlayerController from "../Player/PlayerController";
import SludgeWeapon from "../Player/SludgeWeapon";
import RareCandy from "../Entity/Items/RareCandy";
import Snorlax from "../Entity/Objects/Snorlax";
import CastleLevel from "./CastleLevel";
import GameState from "./GameState";

// ── Checkpoints ───────────────────────────────────────────────────────────────
export const CHECKPOINTS = {
    SPAWN:          new Vec2(13 * 16, 75 * 16),
    CHECKPOINT_ONE: new Vec2(73 * 16, 10 * 16),
    CHECKPOINT_TWO: new Vec2(64 * 16, 42 * 16),
} as const;

export default class WinterLevel extends MBLevel {

    public static readonly PLAYER_SPAWN       = CHECKPOINTS.SPAWN;
    public static readonly PLAYER_SPRITE_KEY  = "PLAYER_SPRITE_KEY";
    public static readonly PLAYER_SPRITE_PATH = "game_assets/spritesheets/Ditto.json";

    public static readonly TILEMAP_KEY            = "Wintermap";
    public static readonly TILEMAP_PATH           = "game_assets/tilemaps/wintermap.json";
    public static readonly TILEMAP_SCALE          = new Vec2(1, 1);
    public static readonly DESTRUCTIBLE_LAYER_KEY = undefined;
    public static readonly WALLS_LAYER_KEY        = "Ground";
    public static readonly DAMAGE_LAYER_KEY       = "Damage";

    public static readonly LEVEL_MUSIC_KEY  = "LEVEL_MUSIC";
    public static readonly LEVEL_MUSIC_PATH = "game_assets/music/jeanparker_synced-146-master.wav";

    public static readonly JUMP_AUDIO_KEY  = "PLAYER_JUMP";
    public static readonly JUMP_AUDIO_PATH = "game_assets/sounds/jump.wav";

    public static readonly TRANSFORM_AUDIO_KEY  = "TRANSFORM_KEY";
    public static readonly TRANSFORM_AUDIO_PATH = "game_assets/sounds/ditto_transform.wav";

    public static readonly LEVEL_END_KEY        = "LEVEL_END_AUDIO_KEY";
    public static readonly LEVEL_END_AUDIO_PATH = "game_assets/sounds/level_over.wav";

    public static readonly TILE_DESTROYED_KEY  = "TILE_DESTROYED";
    public static readonly TILE_DESTROYED_PATH = "game_assets/sounds/switch.wav";

    public static readonly CRYO_GRENINJA_SPRITE_KEY  = "Greninja";
    public static readonly CRYO_GRENINJA_SPRITE_PATH = "game_assets/spritesheets/greninja_cryo.json";

    public static readonly ROTOM_SPRITE_KEY  = "Rotom";
    public static readonly ROTOM_SPRITE_PATH = "game_assets/spritesheets/rotom.json";

    // Used by level select to check access
    public static readonly LEVEL_LABEL = "WINTER";

    public static readonly LEVEL_END = new AABB(new Vec2(224, 232), new Vec2(24, 16));

    public constructor(
        viewport: Viewport,
        sceneManager: SceneManager,
        renderingManager: RenderingManager,
        options: Record<string, any>
    ) {
        super(viewport, sceneManager, renderingManager, options);

        this.tilemapKey          = WinterLevel.TILEMAP_KEY;
        this.tilemapScale        = WinterLevel.TILEMAP_SCALE;
        this.wallsLayerKey       = WinterLevel.WALLS_LAYER_KEY;
        this.phantomWallLayerKey = "phasewalls";
        this.damageWallLayerKey  = "damage";

        this.playerSpriteKey = WinterLevel.PLAYER_SPRITE_KEY;
        this.playerSpawn     = WinterLevel.PLAYER_SPAWN;
        this.respawnPosition = this.playerSpawn.clone();

        this.levelMusicKey         = WinterLevel.LEVEL_MUSIC_KEY;
        this.jumpAudioKey          = WinterLevel.JUMP_AUDIO_KEY;
        this.transformAudioKey     = WinterLevel.TRANSFORM_AUDIO_KEY;
        this.tileDestroyedAudioKey = WinterLevel.TILE_DESTROYED_KEY;
        this.levelEndAudioKey      = WinterLevel.LEVEL_END_KEY;

        this.levelEndPosition = new Vec2(94 * 16, 19 * 16).mult(this.tilemapScale);
        this.levelEndHalfSize = new Vec2(32, 32).mult(this.tilemapScale);

        this.checkpoint_sqr1 = CHECKPOINTS.CHECKPOINT_ONE.mult(this.tilemapScale);
        this.checkpoint_sqr2 = CHECKPOINTS.CHECKPOINT_TWO.mult(this.tilemapScale);
    }

    public loadScene(): void {
        // Shared enemy/item sprites — defined once in MBLevel via SpriteKeys
        this.loadSharedSprites();

        this.load.tilemap(this.tilemapKey, WinterLevel.TILEMAP_PATH);
        this.loadPauseMenuAssets();

        this.load.spritesheet(this.playerSpriteKey,                  WinterLevel.PLAYER_SPRITE_PATH);
        this.load.spritesheet(SludgeWeapon.SLUDGE_KEY,               SludgeWeapon.SLUDGE_PATH);
        this.load.spritesheet(WinterLevel.ROTOM_SPRITE_KEY,          WinterLevel.ROTOM_SPRITE_PATH);
        this.load.spritesheet(WinterLevel.CRYO_GRENINJA_SPRITE_KEY,  WinterLevel.CRYO_GRENINJA_SPRITE_PATH);
        this.load.spritesheet(RareCandy.SPRITE_KEY,                  RareCandy.SPRITE_PATH);
        this.load.spritesheet(Snorlax.SPRITE_KEY,                    Snorlax.SPRITE_PATH);
        this.load.spritesheet(this.hintSpriteKey,                    this.hintSpritePath);
        this.load.spritesheet(this.transformUIkey,                   this.transformUIpath);

        this.load.audio(this.levelMusicKey,               WinterLevel.LEVEL_MUSIC_PATH);
        this.load.audio(this.jumpAudioKey,                WinterLevel.JUMP_AUDIO_PATH);
        this.load.audio(this.tileDestroyedAudioKey,       WinterLevel.TILE_DESTROYED_PATH);
        this.load.audio(this.levelEndAudioKey,            WinterLevel.LEVEL_END_AUDIO_PATH);
        this.load.audio(WinterLevel.TRANSFORM_AUDIO_KEY,  WinterLevel.TRANSFORM_AUDIO_PATH);
    }

    public unloadScene(): void {
        this.load.keepSpritesheet(this.playerSpriteKey);
        this.load.keepAudio(this.levelMusicKey);
        this.load.keepAudio(this.jumpAudioKey);
        this.load.keepAudio(this.transformAudioKey);
        this.load.keepAudio(this.tileDestroyedAudioKey);
        this.load.keepAudio(this.levelEndAudioKey);
    }

    public startScene(): void {
        super.startScene();

        // WinterLevel leads into CastleLevel
        this.nextLevel = CastleLevel;

        // Beating winter unlocks the castle
        GameState.getInstance().unlockLevel("STRONGHOLD");

        (this.player._ai as PlayerController).transformations.unlockForm("GRENINJA");
        (this.player._ai as PlayerController).transformations.unlockForm("CHARIZARD");
        (this.player._ai as PlayerController).transformations.activate();

        this.updateTransformRing("GRENINJA");

        this.initializePKMN();
        this.initializeEntities();
        this.respawnPosition = this.playerSpawn.clone();
    }

    protected initializePKMN(): void {
        // Rotom disabled — uncomment to re-enable
        // let rotom = this.add.animatedSprite(WinterLevel.ROTOM_SPRITE_KEY, "PRIMARY");
        // rotom.position.set(WinterLevel.PLAYER_SPAWN.x + 20, WinterLevel.PLAYER_SPAWN.y - 20);
        // rotom.addPhysics(new AABB(Vec2.ZERO, new Vec2(3, 3)));
        // rotom.addAI(RotomController, { playerRef: this.player, speed: 90 });
        // rotom.animation.play("IDLE");
    }

    protected initializeEntities(): void {
        console.log("PROBABLY NOT");
        this.spawnEntity((sprite) => new RareCandy(sprite), RareCandy.SPRITE_KEY, new Vec2(79 * 16, 45 * 16));
        this.spawnEntity((sprite) => new RareCandy(sprite), RareCandy.SPRITE_KEY, new Vec2(15*16, 13*16));
        this.spawnEntity((sprite) => new RareCandy(sprite), RareCandy.SPRITE_KEY, new Vec2(79 * 16, 14*16));

        this.spawnPatroller(new Vec2(45 * 16, 18 * 16), 80, 60, 2, 1);
        

        // Snorlax trampoline — collidable=true so player lands on top
        // this.spawnEntity((sprite) => new Snorlax(sprite), Snorlax.SPRITE_KEY, new Vec2(16 * 16, 75 * 16), true);
    }

    protected initializeViewport(): void {
        super.initializeViewport();
        this.viewport.setBounds(0, 0, 1600, 1600);
    }
}