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
import GameState from "./GameState";
import { SNOWBALL, FIREBALL } from "../Entity/Enemies/ProjectileConfig";
import { SpriteKeys } from "./SpriteKeys";

export const CHECKPOINTS = {
    SPAWN:          new Vec2(7 * 16, 7 * 16),
    CHECKPOINT_ONE: new Vec2(73  * 16, 10 * 16),
    CHECKPOINT_TWO: new Vec2(64  * 16, 42 * 16),
} as const;

export default class MountainLevel extends MBLevel {

    public static readonly PLAYER_SPAWN      = CHECKPOINTS.SPAWN;
    public static readonly PLAYER_SPRITE_KEY = "PLAYER_SPRITE_KEY";
    public static readonly PLAYER_SPRITE_PATH = "game_assets/spritesheets/Ditto.json";

    public static readonly TILEMAP_KEY   = "Mountainmap";
    public static readonly TILEMAP_PATH  = "game_assets/tilemaps/mountain.json";
    public static readonly TILEMAP_SCALE = new Vec2(1, 1);
    public static readonly WALLS_LAYER_KEY  = "Ground";
    public static readonly DAMAGE_LAYER_KEY = "damage";

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

    public static readonly LEVEL_END = new AABB(new Vec2(159 * 16, 232), new Vec2(24, 16));

    public constructor(
        viewport: Viewport,
        sceneManager: SceneManager,
        renderingManager: RenderingManager,
        options: Record<string, any>
    ) {
        super(viewport, sceneManager, renderingManager, options);

        this.tilemapKey      = MountainLevel.TILEMAP_KEY;
        this.tilemapScale    = MountainLevel.TILEMAP_SCALE;
        this.wallsLayerKey   = MountainLevel.WALLS_LAYER_KEY;
        this.phantomWallLayerKey = "phasewalls";
        this.damageWallLayerKey  = MountainLevel.DAMAGE_LAYER_KEY;
        this.destructibleLayerKey = "destructable";

        this.playerSpriteKey = MountainLevel.PLAYER_SPRITE_KEY;
        this.playerSpawn     = MountainLevel.PLAYER_SPAWN;
        this.respawnPosition = this.playerSpawn.clone();

        this.levelMusicKey         = MountainLevel.LEVEL_MUSIC_KEY;
        this.jumpAudioKey          = MountainLevel.JUMP_AUDIO_KEY;
        this.transformAudioKey     = MountainLevel.TRANSFORM_AUDIO_KEY;
        this.tileDestroyedAudioKey = MountainLevel.TILE_DESTROYED_KEY;
        this.levelEndAudioKey      = MountainLevel.LEVEL_END_KEY;

        this.levelEndPosition = new Vec2(159 * 16, 36 * 16).mult(this.tilemapScale);
        this.levelEndHalfSize = new Vec2(32, 32).mult(this.tilemapScale);

        this.checkpoint_sqr1 = CHECKPOINTS.CHECKPOINT_ONE.mult(this.tilemapScale);
        this.checkpoint_sqr2 = CHECKPOINTS.CHECKPOINT_TWO.mult(this.tilemapScale);
    }

    public loadScene(): void {
        // Shared entity sprites (patroller, shooter, projectile, shield)
        this.loadSharedSprites();

        this.load.tilemap(this.tilemapKey, MountainLevel.TILEMAP_PATH);
        this.loadPauseMenuAssets();

        this.load.spritesheet(this.playerSpriteKey, MountainLevel.PLAYER_SPRITE_PATH);
        this.load.spritesheet(SludgeWeapon.SLUDGE_KEY, SludgeWeapon.SLUDGE_PATH);
        this.load.spritesheet(MountainLevel.CRYO_GRENINJA_SPRITE_KEY, MountainLevel.CRYO_GRENINJA_SPRITE_PATH);
        this.load.spritesheet(RareCandy.SPRITE_KEY,  RareCandy.SPRITE_PATH);
        this.load.spritesheet(Snorlax.SPRITE_KEY,    Snorlax.SPRITE_PATH);
        this.load.spritesheet(this.hintSpriteKey,    this.hintSpritePath);
        this.load.spritesheet(this.transformUIkey,   this.transformUIpath);

        this.load.audio(this.levelMusicKey,           MountainLevel.LEVEL_MUSIC_PATH);
        this.load.audio(this.jumpAudioKey,            MountainLevel.JUMP_AUDIO_PATH);
        this.load.audio(this.tileDestroyedAudioKey,   MountainLevel.TILE_DESTROYED_PATH);
        this.load.audio(this.levelEndAudioKey,        MountainLevel.LEVEL_END_AUDIO_PATH);
        this.load.audio(MountainLevel.TRANSFORM_AUDIO_KEY, MountainLevel.TRANSFORM_AUDIO_PATH);
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

        this.nextLevel = MountainLevel;   

        GameState.getInstance().unlockLevel("FOREST");

        const ctrl = this.player._ai as PlayerController;
        ctrl.transformations.unlockForm("GRENINJA");
        ctrl.transformations.unlockForm("CHARIZARD");
        ctrl.transformations.activate();

        this.updateTransformRing("GRENINJA");

        this.initializePKMN();
        this.initializeEntities();
        this.respawnPosition = this.playerSpawn.clone();
    }

    protected initializePKMN(): void {
        // Rotom disabled
    }

    protected initializeEntities(): void {
        // RULE: never pass a class directly to spawnEntity.
        // Always use a factory lambda: (sprite) => new Foo(sprite)
        this.spawnEntity((sprite) => new RareCandy(sprite), RareCandy.SPRITE_KEY, new Vec2(35 * 16, 76 * 16));
        this.spawnEntity((sprite) => new RareCandy(sprite), RareCandy.SPRITE_KEY, new Vec2(173 * 16, 36 * 16));
        this.spawnEntity((sprite) => new RareCandy(sprite), RareCandy.SPRITE_KEY, new Vec2(157  * 16, 18 * 16));

        this.spawnEntity((sprite) => new Snorlax(sprite), Snorlax.SPRITE_KEY, new Vec2(182 * 16, 34.5 * 16), true);
        
        this.spawnPatroller(new Vec2(125 * 16, 19 * 16), 80, 60, 2, 1);
        this.spawnPatroller(new Vec2(153 * 16, 45 * 16), 45, 50, 2, 1);
        this.spawnPatroller(new Vec2(75 * 16, 45 * 16), 45, 50, 2, 1);
        // this.spawnShooter(new Vec2(17 * 16, 32 * 16), SNOWBALL);
        // this.spawnShooter(new Vec2(190 * 16, 22 * 16), FIREBALL, 4, 3.0, 3, 250);
    }

    protected initializeViewport(): void {
        super.initializeViewport();
        this.viewport.setBounds(0, 0, 200 * 16, 50 * 16);
    }
}