import AABB from "../../Wolfie2D/DataTypes/Shapes/AABB";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import MBLevel from "./MBLevel";
import RenderingManager from "../../Wolfie2D/Rendering/RenderingManager";
import SceneManager from "../../Wolfie2D/Scene/SceneManager";
import Viewport from "../../Wolfie2D/SceneGraph/Viewport";
import MBLevel2 from "./MBLevel2";
import PlayerController from "../Player/PlayerController";
import PokemonController from "../Pokemon/PokemonController";
import RowletController from "../Pokemon/PokemonActors/RowletController";
import PhantumpController from "../Pokemon/PokemonActors/PhantumpController";
import RotomController from "../Pokemon/PokemonActors/RotomController";
import SludgeWeapon from "../Player/SludgeWeapon";
import MainMenu from "./MainMenu";
/**
 * The first level for MB - should be the one with the grass and the clouds.
 */
export const CHECKPOINTS = {
    SPAWN : new Vec2(13*16,75*16),
    CHECKPOINT_ONE : new Vec2(73*16,10*16),
    CHECKPOINT_TWO : new Vec2(64*16,42*16),
} as const;


export default class WinterLevel extends MBLevel {
    
    // public static readonly PLAYER_SPAWN = new Vec2(5*16, 160);
    public static readonly PLAYER_SPAWN = CHECKPOINTS.SPAWN;
    public static readonly PLAYER_SPRITE_KEY = "PLAYER_SPRITE_KEY";
    public static readonly PLAYER_SPRITE_PATH = "game_assets/spritesheets/Ditto.json";

    public static readonly TILEMAP_KEY = "Wintermap";
    public static readonly TILEMAP_PATH = "game_assets/tilemaps/wintermap.json";
    public static readonly TILEMAP_SCALE = new Vec2(1, 1);
    public static readonly DESTRUCTIBLE_LAYER_KEY = undefined;
    public static readonly WALLS_LAYER_KEY = "Ground";
    public static readonly DAMAGE_LAYER_KEY ="damage"

    public static readonly LEVEL_MUSIC_KEY = "LEVEL_MUSIC";
    public static readonly LEVEL_MUSIC_PATH = "game_assets/music/winterlevel_prototype.wav";

    public static readonly JUMP_AUDIO_KEY = "PLAYER_JUMP";
    public static readonly JUMP_AUDIO_PATH = "game_assets/sounds/jump.wav";

    public static readonly TRANSFORM_AUDIO_KEY = "TRANSFORM_KEY";
    public static readonly TRANSFORM_AUDIO_PATH = "game_assets/sounds/ditto_transform.wav"

    public static readonly LEVEL_END_KEY = "LEVEL_END_AUDIO_KEY"
    public static readonly LEVEL_END_AUDIO_PATH = "game_assets/sounds/level_over.wav"

    public static readonly TILE_DESTROYED_KEY = "TILE_DESTROYED";
    public static readonly TILE_DESTROYED_PATH = "game_assets/sounds/switch.wav";

    public static readonly CRYO_GRENINJA_SPRITE_KEY = "Greninja"
    public static readonly CRYO_GRENINJA_SPRITE_PATH = "game_assets/spritesheets/greninja_cryo.json"

    
    // public static readonly PHANTUMP_WALL_LAYER = "PhantumpWallLayer"
    
    public static readonly ROTOM_SPRITE_KEY  = "Rotom";
    public static readonly ROTOM_SPRITE_PATH = "game_assets/spritesheets/rotom.json";
    
    

    
    public static readonly LEVEL_END = new AABB(new Vec2(224, 232), new Vec2(24, 16));
    

    public constructor(viewport: Viewport, sceneManager: SceneManager, renderingManager: RenderingManager, options: Record<string, any>) {
        super(viewport, sceneManager, renderingManager, options);

        // Set the keys for the different layers of the tilemap
        this.tilemapKey = WinterLevel.TILEMAP_KEY;
        this.tilemapScale = WinterLevel.TILEMAP_SCALE;
        // this.destructibleLayerKey = WinterLevel.DESTRUCTIBLE_LAYER_KEY;
        this.wallsLayerKey = WinterLevel.WALLS_LAYER_KEY;
        this.phantomWallLayerKey = "phasewalls"; 
        // Set the key for the player's sprite
        this.playerSpriteKey = WinterLevel.PLAYER_SPRITE_KEY;
        // Set the player's spawn
        this.playerSpawn = WinterLevel.PLAYER_SPAWN;
        this.respawnPosition = this.playerSpawn.clone();
        // Music and sound
        this.levelMusicKey = WinterLevel.LEVEL_MUSIC_KEY
        this.jumpAudioKey = WinterLevel.JUMP_AUDIO_KEY;
        this.transformAudioKey = WinterLevel.TRANSFORM_AUDIO_KEY;
        this.tileDestroyedAudioKey = WinterLevel.TILE_DESTROYED_KEY;
        this.levelEndAudioKey = WinterLevel.LEVEL_END_KEY;
        this.damageWallLayerKey = "damage";

        // Level end size and position
        this.levelEndPosition = new Vec2(12*16, 39*16).mult(this.tilemapScale);
        this.levelEndHalfSize = new Vec2(32, 32).mult(this.tilemapScale);

        this.checkpoint_sqr1 =  CHECKPOINTS.CHECKPOINT_ONE.mult(this.tilemapScale);
        this.checkpoint_sqr2 =  CHECKPOINTS.CHECKPOINT_TWO.mult(this.tilemapScale);
        
    }

    /**
     * Load in our resources for level 1
     */
    public loadScene(): void {
        // Load in the tilemap
        this.load.tilemap(this.tilemapKey, WinterLevel.TILEMAP_PATH);
        // Load in the player's sprite
        this.load.spritesheet(this.playerSpriteKey, WinterLevel.PLAYER_SPRITE_PATH);
        this.load.spritesheet(SludgeWeapon.SLUDGE_KEY, SludgeWeapon.SLUDGE_PATH);
        this.load.spritesheet(WinterLevel.ROTOM_SPRITE_KEY, WinterLevel.ROTOM_SPRITE_PATH);

        // Audio and music
        this.load.audio(this.levelMusicKey, WinterLevel.LEVEL_MUSIC_PATH);
        this.load.audio(this.jumpAudioKey, WinterLevel.JUMP_AUDIO_PATH);
        this.load.audio(this.tileDestroyedAudioKey, WinterLevel.TILE_DESTROYED_PATH);
        this.load.audio(this.levelEndAudioKey, WinterLevel.LEVEL_END_AUDIO_PATH);
        this.load.spritesheet(WinterLevel.CRYO_GRENINJA_SPRITE_KEY, WinterLevel.CRYO_GRENINJA_SPRITE_PATH);
        
        this.load.audio(WinterLevel.TRANSFORM_AUDIO_KEY, WinterLevel.TRANSFORM_AUDIO_PATH);
    }

    /**
     * Unload resources for level 1 - decide what to keep
     */
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
        // Set the next level to be Level2
        this.nextLevel = MBLevel2;
        (this.player._ai as PlayerController).transformations.unlockForm("GRENINJA");
        
        this.initializePKMN();
        this.respawnPosition = this.playerSpawn.clone();
    }
    protected initializePKMN(): void {

        let greninja = this.add.animatedSprite(WinterLevel.CRYO_GRENINJA_SPRITE_KEY, "PRIMARY");
        greninja.position.set(42* 16,75*16)
        greninja.animation.play("DEFAULT");
        
        let rotom = this.add.animatedSprite(WinterLevel.ROTOM_SPRITE_KEY, "PRIMARY");
        rotom.position.set(WinterLevel.PLAYER_SPAWN.x + 20, WinterLevel.PLAYER_SPAWN.y - 20);
        rotom.addPhysics(new AABB(Vec2.ZERO, new Vec2(3, 3)));
        rotom.addAI(RotomController, {
            playerRef: this.player,
            speed: 90,
        });
        rotom.animation.play("IDLE");

        // CURRENTLY U
        // let rowlet = this.add.animatedSprite(WinterLevel.ROWLET_SPRITE_KEY, "PRIMARY");
        // rowlet.position.set(16*16, 16*8);
        // rowlet.addPhysics(new AABB(Vec2.ZERO, new Vec2(8, 8)));
        // rowlet.addAI(RowletController, {
        //     playerRef: this.player,          
        //     patrolLeft:  rowlet.position.x - 80,
        //     patrolRight: rowlet.position.x + 80,
        //     speed: 60,
        //     maxHealth: 4,
        // });
        
        
    }

    /**
     *  Current map size are the viewport limits
     */
    protected initializeViewport(): void {
    super.initializeViewport();
    this.viewport.setBounds(0, 0, 1600, 1600); // was 0, 128
}

}