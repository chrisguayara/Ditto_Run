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
import RareCandy from "../Entity/Items/RareCandy";
import Snorlax from "../Entity/Objects/Snorlax";
/**
 * The first level for MB - should be the one with the grass and the clouds.
 */
export const CHECKPOINTS = {
    SPAWN : new Vec2(40*16, 5*16) ,
    // new Vec2(5*16,9*16),
    CHECKPOINT_ONE : new Vec2(73*16,10*16),
    CHECKPOINT_TWO : new Vec2(64*16,42*16),
} as const;


export default class ForestLevel extends MBLevel {
    
    // public static readonly PLAYER_SPAWN = new Vec2(5*16, 160);
    public static readonly PLAYER_SPAWN = CHECKPOINTS.SPAWN;
    public static readonly PLAYER_SPRITE_KEY = "PLAYER_SPRITE_KEY";
    public static readonly PLAYER_SPRITE_PATH = "game_assets/spritesheets/Ditto.json";

    public static readonly TILEMAP_KEY = "ForestLevelFinal";
    public static readonly TILEMAP_PATH = "game_assets/tilemaps/forestmap.json";
    public static readonly TILEMAP_SCALE = new Vec2(1, 1);
    public static readonly DESTRUCTIBLE_LAYER_KEY = undefined;
    public static readonly WALLS_LAYER_KEY = "Ground";
    public static readonly DAMAGE_LAYER_KEY ="damage"

    public static readonly LEVEL_MUSIC_KEY = "LEVEL_MUSIC";
    public static readonly LEVEL_MUSIC_PATH = "game_assets/music/equivalence_loop.mp3";

    public static readonly JUMP_AUDIO_KEY = "PLAYER_JUMP";
    public static readonly JUMP_AUDIO_PATH = "game_assets/sounds/jump.wav";

    public static readonly TRANSFORM_AUDIO_KEY = "TRANSFORM_KEY";
    public static readonly TRANSFORM_AUDIO_PATH = "game_assets/sounds/ditto_transform.wav"

    public static readonly LEVEL_END_KEY = "LEVEL_END_AUDIO_KEY"
    public static readonly LEVEL_END_AUDIO_PATH = "game_assets/sounds/level_over.wav"

    public static readonly TILE_DESTROYED_KEY = "TILE_DESTROYED";
    public static readonly TILE_DESTROYED_PATH = "game_assets/sounds/switch.wav";

    public static readonly ROWLET_SPRITE_KEY = "Rowlet"
    public static readonly ROWLET_SPRITE_PATH = "game_assets/spritesheets/rowlet.json"

    public static readonly PHANTUMP_SPRITE_KEY = "Phantump"
    public static readonly PHANTUMP_SPRITE_PATH = "game_assets/spritesheets/phantump.json"

    // public static readonly PHANTUMP_WALL_LAYER = "PhantumpWallLayer"
    
    public static readonly ROTOM_SPRITE_KEY  = "Rotom";
    public static readonly ROTOM_SPRITE_PATH = "game_assets/spritesheets/rotom.json";

    public static readonly UI_TRANSFORM_KEY = "transformUI"
    public static readonly UI_HEALTH_KEY = "healthUI"
    public static readonly UI_ENERGY_KEY = "energyUI"
    public static readonly UI_ENERGY_PATH = ""


    
    
    
    

    
    public static readonly LEVEL_END = new AABB(new Vec2(224, 232), new Vec2(24, 16));
    

    public constructor(viewport: Viewport, sceneManager: SceneManager, renderingManager: RenderingManager, options: Record<string, any>) {
        super(viewport, sceneManager, renderingManager, options);

        // Set the keys for the different layers of the tilemap
        this.tilemapKey = ForestLevel.TILEMAP_KEY;
        this.tilemapScale = ForestLevel.TILEMAP_SCALE;
        // this.destructibleLayerKey = ForestLevel.DESTRUCTIBLE_LAYER_KEY;
        this.wallsLayerKey = ForestLevel.WALLS_LAYER_KEY;
        this.phantomWallLayerKey = "phasewalls"; 
        // Set the key for the player's sprite
        this.playerSpriteKey = ForestLevel.PLAYER_SPRITE_KEY;
        // Set the player's spawn
        this.playerSpawn = ForestLevel.PLAYER_SPAWN;
        this.respawnPosition = this.playerSpawn.clone();
        // Music and sound
        this.levelMusicKey = ForestLevel.LEVEL_MUSIC_KEY
        this.jumpAudioKey = ForestLevel.JUMP_AUDIO_KEY;
        this.transformAudioKey = ForestLevel.TRANSFORM_AUDIO_KEY;
        this.tileDestroyedAudioKey = ForestLevel.TILE_DESTROYED_KEY;
        this.levelEndAudioKey = ForestLevel.LEVEL_END_KEY;
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
        this.load.tilemap(this.tilemapKey, ForestLevel.TILEMAP_PATH);
        this.loadPauseMenuAssets();
        // Load in the player's sprite
        this.load.spritesheet(this.playerSpriteKey, ForestLevel.PLAYER_SPRITE_PATH);
        this.load.spritesheet(SludgeWeapon.SLUDGE_KEY, SludgeWeapon.SLUDGE_PATH);
        this.load.spritesheet(ForestLevel.ROTOM_SPRITE_KEY, ForestLevel.ROTOM_SPRITE_PATH);

        // Audio and music
        this.load.audio(this.levelMusicKey, ForestLevel.LEVEL_MUSIC_PATH);
        this.load.audio(this.jumpAudioKey, ForestLevel.JUMP_AUDIO_PATH);
        this.load.audio(this.tileDestroyedAudioKey, ForestLevel.TILE_DESTROYED_PATH);
        this.load.audio(this.levelEndAudioKey, ForestLevel.LEVEL_END_AUDIO_PATH);
        this.load.spritesheet(ForestLevel.ROWLET_SPRITE_KEY, ForestLevel.ROWLET_SPRITE_PATH);
        this.load.spritesheet(ForestLevel.PHANTUMP_SPRITE_KEY, ForestLevel.PHANTUMP_SPRITE_PATH);
        this.load.audio(ForestLevel.TRANSFORM_AUDIO_KEY, ForestLevel.TRANSFORM_AUDIO_PATH);
        this.load.audio(this.selectAudioKey,this.selectAudioPath);

        this.load.spritesheet(RareCandy.SPRITE_KEY, RareCandy.SPRITE_PATH);
        this.load.spritesheet(Snorlax.SPRITE_KEY, Snorlax.SPRITE_PATH);
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
        this.load.keepAudio(this.selectAudioKey);
    }

    public startScene(): void {
        super.startScene();
        // Set the next level to be Level2
        this.nextLevel = MBLevel2;
        (this.player._ai as PlayerController).transformations.unlockForm("PHANTUMP");
        (this.player._ai as PlayerController).transformations.unlockForm("ROWLET");
        this.initializePKMN();
        this.initializeEntities();
        this.respawnPosition = this.playerSpawn.clone();
    }
    protected initializePKMN(): void {
        let rowlet = this.add.animatedSprite(ForestLevel.ROWLET_SPRITE_KEY, "PRIMARY");
        rowlet.position.set(36*16, 7*8);
        rowlet.addPhysics(new AABB(Vec2.ZERO, new Vec2(8, 8)));
        rowlet.addAI(RowletController, {
            playerRef: this.player,          
            patrolLeft:  rowlet.position.x - 80,
            patrolRight: rowlet.position.x + 80,
            speed: 60,
            maxHealth: 4,
        });
        rowlet.animation.play("IDLE");
        let rotom = this.add.animatedSprite(ForestLevel.ROTOM_SPRITE_KEY, "PRIMARY");
        rotom.position.set(ForestLevel.PLAYER_SPAWN.x + 20, ForestLevel.PLAYER_SPAWN.y - 20);
        rotom.addPhysics(new AABB(Vec2.ZERO, new Vec2(3, 3)));
        rotom.addAI(RotomController, {
            playerRef: this.player,
            speed: 90,
        });
        rotom.animation.play("IDLE");
        let phantump = this.add.animatedSprite(ForestLevel.PHANTUMP_SPRITE_KEY, "PRIMARY");
        phantump.position.set(67*16,24*13);
        phantump.addPhysics(new AABB(Vec2.ZERO, new Vec2(8, 8)));
        phantump.addAI(PhantumpController, {
            playerRef: this.player,
            patrolLeft:  phantump.position.x - 100,
            patrolRight: phantump.position.x + 100,
            speed: 80,
            maxHealth: 8,
        });
        phantump.animation.play("IDLE");
    }
    protected initializeEntities(): void {
            
            this.spawnEntity(RareCandy, RareCandy.SPRITE_KEY, new Vec2(10*16, 8*16));
            this.spawnEntity(RareCandy, RareCandy.SPRITE_KEY, new Vec2(44*16, 9*16),true);
        
            // Snorlax as a trampoline platform — collidable=true so player lands on it
            this.spawnEntity(Snorlax, Snorlax.SPRITE_KEY, new Vec2(44*16, 13*16), true);
        }

    /**
     *  Current map size are the viewport limits
     */
    protected initializeViewport(): void {
    super.initializeViewport();
    this.viewport.setBounds(0, 0, 1600, 1600); // was 0, 128
}

}