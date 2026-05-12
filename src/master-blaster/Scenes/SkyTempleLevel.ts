import AABB from "../../Wolfie2D/DataTypes/Shapes/AABB";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import MBLevel, { MBLayers } from "./MBLevel";
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
import MainMenu from "./MainMenu";

export const CHECKPOINTS = {
    
    SPAWN:          new Vec2(16 * 16, 114 * 16),
    CHECKPOINT_ONE: new Vec2(34  * 16, 52 * 16),
    CHECKPOINT_TWO: new Vec2(329  * 16, 72 * 16),
} as const;

export default class SkyTempleLevel extends MBLevel {

    public static readonly PLAYER_SPAWN      = CHECKPOINTS.SPAWN;
    public static readonly PLAYER_SPRITE_KEY = "PLAYER_SPRITE_KEY";
    public static readonly PLAYER_SPRITE_PATH = "game_assets/spritesheets/Ditto.json";

    public static readonly TILEMAP_KEY   = "SkyTemplemap";
    public static readonly TILEMAP_PATH  = "game_assets/tilemaps/skytemplemap.json";
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

    public static readonly LEVEL_END = new AABB(new Vec2(13 * 16, 17*16), new Vec2(24, 16));

    public constructor(
        viewport: Viewport,
        sceneManager: SceneManager,
        renderingManager: RenderingManager,
        options: Record<string, any>
    ) {
        super(viewport, sceneManager, renderingManager, options);

        this.tilemapKey      = SkyTempleLevel.TILEMAP_KEY;
        this.tilemapScale    = SkyTempleLevel.TILEMAP_SCALE;
        this.wallsLayerKey   = SkyTempleLevel.WALLS_LAYER_KEY;
        this.phantomWallLayerKey = "phasewalls";
        this.damageWallLayerKey  = SkyTempleLevel.DAMAGE_LAYER_KEY;
        this.destructibleLayerKey = "destructable";

        this.playerSpriteKey = SkyTempleLevel.PLAYER_SPRITE_KEY;
        this.playerSpawn     = SkyTempleLevel.PLAYER_SPAWN;
        this.respawnPosition = this.playerSpawn.clone();

        this.levelMusicKey         = SkyTempleLevel.LEVEL_MUSIC_KEY;
        this.jumpAudioKey          = SkyTempleLevel.JUMP_AUDIO_KEY;
        this.transformAudioKey     = SkyTempleLevel.TRANSFORM_AUDIO_KEY;
        this.tileDestroyedAudioKey = SkyTempleLevel.TILE_DESTROYED_KEY;
        this.levelEndAudioKey      = SkyTempleLevel.LEVEL_END_KEY;

        this.levelEndPosition = new Vec2(13 * 16, 17 * 16).mult(this.tilemapScale);
        this.levelEndHalfSize = new Vec2(64, 64).mult(this.tilemapScale);

        this.checkpoint_sqr1 = CHECKPOINTS.CHECKPOINT_ONE.mult(this.tilemapScale);
        this.checkpoint_sqr2 = CHECKPOINTS.CHECKPOINT_TWO.mult(this.tilemapScale);
    }

    public loadScene(): void {
        // Shared entity sprites (patroller, shooter, projectile, shield)
        this.loadSharedSprites();

        this.load.tilemap(this.tilemapKey, SkyTempleLevel.TILEMAP_PATH);
        this.loadPauseMenuAssets();

        this.load.spritesheet(this.playerSpriteKey, SkyTempleLevel.PLAYER_SPRITE_PATH);
        this.load.spritesheet(SludgeWeapon.SLUDGE_KEY, SludgeWeapon.SLUDGE_PATH);
        this.load.spritesheet(SkyTempleLevel.CRYO_GRENINJA_SPRITE_KEY, SkyTempleLevel.CRYO_GRENINJA_SPRITE_PATH);
        this.load.spritesheet(RareCandy.SPRITE_KEY,  RareCandy.SPRITE_PATH);
        this.load.spritesheet(Snorlax.SPRITE_KEY,    Snorlax.SPRITE_PATH);
        this.load.spritesheet(this.hintSpriteKey,    this.hintSpritePath);
        this.load.spritesheet(this.transformUIkey,   this.transformUIpath);

        this.load.audio(this.levelMusicKey,           SkyTempleLevel.LEVEL_MUSIC_PATH);
        this.load.audio(this.jumpAudioKey,            SkyTempleLevel.JUMP_AUDIO_PATH);
        this.load.audio(this.tileDestroyedAudioKey,   SkyTempleLevel.TILE_DESTROYED_PATH);
        this.load.audio(this.levelEndAudioKey,        SkyTempleLevel.LEVEL_END_AUDIO_PATH);
        this.load.audio(SkyTempleLevel.TRANSFORM_AUDIO_KEY, SkyTempleLevel.TRANSFORM_AUDIO_PATH);
        this.load.spritesheet("mountainmap_background", "game_assets/tilemaps/backgrounds/mountainmap_background.json");
        this.loadEndScreenAssets();


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
        this.addParallaxLayer(MBLayers.BACKGROUND, new Vec2(0.1, 0.1), -1);
        super.startScene();

        this.nextLevel = MainMenu;   

        
        GameState.getInstance().resetLevelStats(5);

        const ctrl = this.player._ai as PlayerController;
        ctrl.transformations.unlockForm("GRENINJA");
        ctrl.transformations.unlockForm("CHARIZARD");
        ctrl.transformations.activate();

        this.updateTransformRing("GRENINJA");

        this.initializePKMN();
        this.initializeEntities();
        this.respawnPosition = this.playerSpawn.clone();
        const bg = this.add.animatedSprite("mountainmap_background", MBLayers.BACKGROUND);
        bg.position.set(600, 140); 
        
        bg.animation.play("IDLE", true);
    }

    protected initializePKMN(): void {
        // Rotom disabled
    }

    protected initializeEntities(): void {
        // RULE: never pass a class directly to spawnEntity.
        // Always use a factory lambda: (sprite) => new Foo(sprite)
        this.spawnEntity((sprite) => new RareCandy(sprite), RareCandy.SPRITE_KEY, new Vec2(34 * 16, 40 * 16));
        this.spawnEntity((sprite) => new RareCandy(sprite), RareCandy.SPRITE_KEY, new Vec2(74 * 16, 57 * 16));
        this.spawnEntity((sprite) => new RareCandy(sprite), RareCandy.SPRITE_KEY, new Vec2(168  * 16, 39 * 16));
        this.spawnEntity((sprite) => new RareCandy(sprite), RareCandy.SPRITE_KEY, new Vec2(53  * 16, 72 * 16));
        this.spawnEntity((sprite) => new RareCandy(sprite), RareCandy.SPRITE_KEY, new Vec2(54  * 16, 23 * 16));

        this.spawnEntity((sprite) => new Snorlax(sprite), Snorlax.SPRITE_KEY, new Vec2(51 * 16, 92.5 * 16), true);
        this.spawnEntity((sprite) => new Snorlax(sprite), Snorlax.SPRITE_KEY, new Vec2(46 * 16, 86.5 * 16), true);
        this.spawnEntity((sprite) => new Snorlax(sprite), Snorlax.SPRITE_KEY, new Vec2(53 * 16, 78.5 * 16), true);
        this.spawnEntity((sprite) => new Snorlax(sprite), Snorlax.SPRITE_KEY, new Vec2(47 * 16, 71.5 * 16), true);
        this.spawnEntity((sprite) => new Snorlax(sprite), Snorlax.SPRITE_KEY, new Vec2(74 * 16, 32.5 * 16), true);
        
        this.spawnPatroller(new Vec2(31 * 16, 35 * 16), 80, 60, 2, 1);
        this.spawnPatroller(new Vec2(60 * 16, 52 * 16), 23, 50, 2, 1);
        this.spawnPatroller(new Vec2(50 * 16, 66 * 16), 45, 50, 2, 1);
        this.spawnPatroller(new Vec2(64 * 16, 18 * 16), 45, 50, 2, 1);
        
        // this.spawnShooter(new Vec2(17 * 16, 32 * 16), SNOWBALL);
        // this.spawnShooter(new Vec2(190 * 16, 22 * 16), FIREBALL, 4, 3.0, 3, 250);
    }

    protected initializeViewport(): void {
        super.initializeViewport();
        this.viewport.setBounds(0, 0, 80 * 16, 120 * 16);
    }
}