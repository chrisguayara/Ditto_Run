import AABB from "../../Wolfie2D/DataTypes/Shapes/AABB";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import MBLevel from "./MBLevel";
import RenderingManager from "../../Wolfie2D/Rendering/RenderingManager";
import SceneManager from "../../Wolfie2D/Scene/SceneManager";
import Viewport from "../../Wolfie2D/SceneGraph/Viewport";
import MBLevel2 from "./MBLevel2";

/**
 * The first level for MB - should be the one with the grass and the clouds.
 */
export default class ForestLevel extends MBLevel {

    public static readonly PLAYER_SPAWN = new Vec2(32, 32);
    public static readonly PLAYER_SPRITE_KEY = "PLAYER_SPRITE_KEY";
    public static readonly PLAYER_SPRITE_PATH = "game_assets/spritesheets/Ditto.json";

    public static readonly TILEMAP_KEY = "ForestLevel";
    public static readonly TILEMAP_PATH = "game_assets/tilemaps/ForestLevel.json";
    public static readonly TILEMAP_SCALE = new Vec2(1, 1);
    public static readonly DESTRUCTIBLE_LAYER_KEY = undefined;
    public static readonly WALLS_LAYER_KEY = "Ground";

    public static readonly LEVEL_MUSIC_KEY = "LEVEL_MUSIC";
    public static readonly LEVEL_MUSIC_PATH = "game_assets/music/MB_level_music.wav";

    public static readonly JUMP_AUDIO_KEY = "PLAYER_JUMP";
    public static readonly JUMP_AUDIO_PATH = "game_assets/sounds/jump.wav";

    public static readonly TILE_DESTROYED_KEY = "TILE_DESTROYED";
    public static readonly TILE_DESTROYED_PATH = "game_assets/sounds/switch.wav";

    public static readonly LEVEL_END = new AABB(new Vec2(224, 232), new Vec2(24, 16));

    public constructor(viewport: Viewport, sceneManager: SceneManager, renderingManager: RenderingManager, options: Record<string, any>) {
        super(viewport, sceneManager, renderingManager, options);

        // Set the keys for the different layers of the tilemap
        this.tilemapKey = ForestLevel.TILEMAP_KEY;
        this.tilemapScale = ForestLevel.TILEMAP_SCALE;
        // this.destructibleLayerKey = ForestLevel.DESTRUCTIBLE_LAYER_KEY;
        this.wallsLayerKey = ForestLevel.WALLS_LAYER_KEY;

        // Set the key for the player's sprite
        this.playerSpriteKey = ForestLevel.PLAYER_SPRITE_KEY;
        // Set the player's spawn
        this.playerSpawn = ForestLevel.PLAYER_SPAWN;

        // Music and sound
        this.levelMusicKey = ForestLevel.LEVEL_MUSIC_KEY
        this.jumpAudioKey = ForestLevel.JUMP_AUDIO_KEY;
        this.tileDestroyedAudioKey = ForestLevel.TILE_DESTROYED_KEY;

        // Level end size and position
        this.levelEndPosition = new Vec2(360, 216).mult(this.tilemapScale);
        this.levelEndHalfSize = new Vec2(32, 32).mult(this.tilemapScale);
    }

    /**
     * Load in our resources for level 1
     */
    public loadScene(): void {
        // Load in the tilemap
        this.load.tilemap(this.tilemapKey, ForestLevel.TILEMAP_PATH);
        // Load in the player's sprite
        this.load.spritesheet(this.playerSpriteKey, ForestLevel.PLAYER_SPRITE_PATH);
        // Audio and music
        this.load.audio(this.levelMusicKey, ForestLevel.LEVEL_MUSIC_PATH);
        this.load.audio(this.jumpAudioKey, ForestLevel.JUMP_AUDIO_PATH);
        this.load.audio(this.tileDestroyedAudioKey, ForestLevel.TILE_DESTROYED_PATH);
    }

    /**
     * Unload resources for level 1 - decide what to keep
     */
    public unloadScene(): void {
        this.load.keepSpritesheet(this.playerSpriteKey);
        this.load.keepAudio(this.levelMusicKey);
        this.load.keepAudio(this.jumpAudioKey);
        this.load.keepAudio(this.tileDestroyedAudioKey);
    }

    public startScene(): void {
        super.startScene();
        // Set the next level to be Level2
        this.nextLevel = MBLevel2;
    }

    /**
     *  Current map size are the viewport limits
     */
    protected initializeViewport(): void {
        super.initializeViewport();
        this.viewport.setBounds(0, 128, 960, 960);
    }

}