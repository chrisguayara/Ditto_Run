import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import MBLevel, { MBLayers } from "./MBLevel";
import RenderingManager from "../../Wolfie2D/Rendering/RenderingManager";
import SceneManager from "../../Wolfie2D/Scene/SceneManager";
import Viewport from "../../Wolfie2D/SceneGraph/Viewport";
import PlayerController from "../Player/PlayerController";
import SludgeWeapon from "../Player/SludgeWeapon";
import GameState from "./GameState";
import WinterLevel from "./WinterLevel";
import CutsceneSystem from "../Cutscene/CutsceneSystem";
import { PrologueLines } from "../Cutscene/CutsceneType";
import MBAnimatedSprite from "../Nodes/MBAnimatedSprite";
import { GameEventType } from "../../Wolfie2D/Events/GameEventType";
import AudioManager, { AudioChannelType } from "../../Wolfie2D/Sound/AudioManager";
import Input from "../../Wolfie2D/Input/Input";
import Timer from "../../Wolfie2D/Timing/Timer";
import GameEvent from "../../Wolfie2D/Events/GameEvent";
import { MBEvents } from "../MBEvents";

export const CHECKPOINTS = {
    SPAWN: new Vec2(20 * 16, 27 * 16),
} as const;

export default class Prologue extends MBLevel {

    public static readonly PLAYER_SPAWN      = CHECKPOINTS.SPAWN;
    public static readonly PLAYER_SPRITE_KEY = "PLAYER_SPRITE_KEY";
    public static readonly CUTSCENE_MUSIC_KEY  = "CUTSCENE_MUSIC";
    public static readonly CUTSCENE_MUSIC_PATH = "game_assets/music/jean parker - ultra [137].mp3"; 
    public static readonly TILEMAP_KEY      = "Prologuemap";
    public static readonly TILEMAP_PATH     = "game_assets/tilemaps/prologue.json";
    public static readonly TILEMAP_SCALE    = new Vec2(1, 1);
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

    public static readonly STEAMHEART_KEY  = "STEAMHEART";
    public static readonly STEAMHEART_PATH = "game_assets/spritesheets/entities/steamheart.json";

    private cutscene!: CutsceneSystem;
    private cryoGreninjaSprite!: MBAnimatedSprite;

    public constructor(
        viewport: Viewport,
        sceneManager: SceneManager,
        renderingManager: RenderingManager,
        options: Record<string, any>
    ) {
        super(viewport, sceneManager, renderingManager, options);

        this.tilemapKey           = Prologue.TILEMAP_KEY;
        this.tilemapScale         = Prologue.TILEMAP_SCALE;
        this.wallsLayerKey        = Prologue.WALLS_LAYER_KEY;
        this.phantomWallLayerKey  = "phasewalls";
        this.damageWallLayerKey   = Prologue.DAMAGE_LAYER_KEY;
        this.destructibleLayerKey = "destructable";

        this.playerSpriteKey = Prologue.PLAYER_SPRITE_KEY;
        this.playerSpawn     = Prologue.PLAYER_SPAWN;
        this.respawnPosition = this.playerSpawn.clone();

        this.levelMusicKey         = Prologue.LEVEL_MUSIC_KEY;
        this.jumpAudioKey          = Prologue.JUMP_AUDIO_KEY;
        this.transformAudioKey     = Prologue.TRANSFORM_AUDIO_KEY;
        this.tileDestroyedAudioKey = Prologue.TILE_DESTROYED_KEY;
        this.levelEndAudioKey      = Prologue.LEVEL_END_KEY;

        this.levelEndPosition = new Vec2(40 * 16, 26 * 16).mult(this.tilemapScale);
        this.levelEndHalfSize = new Vec2(64, 64).mult(this.tilemapScale);
    }

    public loadScene(): void {
        this.loadSharedSprites();

        this.load.tilemap(this.tilemapKey, Prologue.TILEMAP_PATH);
        this.loadPauseMenuAssets();

        this.load.spritesheet(this.playerSpriteKey,              Prologue.PLAYER_SPRITE_PATH);
        this.load.spritesheet(SludgeWeapon.SLUDGE_KEY,           SludgeWeapon.SLUDGE_PATH);
        this.load.spritesheet(Prologue.CRYO_GRENINJA_SPRITE_KEY, Prologue.CRYO_GRENINJA_SPRITE_PATH);
        this.load.spritesheet(this.hintSpriteKey,                this.hintSpritePath);
        this.load.spritesheet(this.transformUIkey,               this.transformUIpath);

        this.load.audio(this.levelMusicKey,           Prologue.LEVEL_MUSIC_PATH);
        this.load.audio(this.jumpAudioKey,            Prologue.JUMP_AUDIO_PATH);
        this.load.audio(this.tileDestroyedAudioKey,   Prologue.TILE_DESTROYED_PATH);
        this.load.audio(this.levelEndAudioKey,        Prologue.LEVEL_END_AUDIO_PATH);
        this.load.audio(Prologue.TRANSFORM_AUDIO_KEY, Prologue.TRANSFORM_AUDIO_PATH);
        this.load.audio(Prologue.CUTSCENE_MUSIC_KEY, Prologue.CUTSCENE_MUSIC_PATH);

        this.load.spritesheet("mountainmap_background",
            "game_assets/tilemaps/backgrounds/mountainmap_background.json");

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

        this.nextLevel = WinterLevel;
        GameState.getInstance().unlockLevel("SKYTEMPLE");
        GameState.getInstance().resetLevelStats(0);

        const ctrl = this.player._ai as PlayerController;
        ctrl.transformations.unlockForm("GRENINJA");
        ctrl.transformations.unlockForm("CHARIZARD");
        ctrl.transformations.activate();
        this.updateTransformRing("GRENINJA");

        this.respawnPosition = this.playerSpawn.clone();

        const bg = this.add.animatedSprite("mountainmap_background", MBLayers.BACKGROUND);
        bg.position.set(600, 140);
        bg.animation.play("IDLE", true);

        // Hide all HUD — prologue has no gameplay UI
        this.UI_transformationSprite.visible = false;
        this.UI_escapeSprite.visible         = false;

        this.initializePKMN();
        this.initializeEntities();
        this.initializeCutscene();
    }

    // ── Override LEVEL_START ──────────────────────────────────────
    // Skip countdown entirely. Enable input immediately so the player
    // can advance dialogue. Player movement is still blocked by
    // ctrl.isPaused = true set in initializeCutscene().

    protected handleEvent(event: GameEvent): void {
        if (event.type === MBEvents.LEVEL_START) {
            // Start music at reduced volume
         if (event.type === MBEvents.LEVEL_START) {
            Input.enableInput();
            return;
        }
            AudioManager.setVolume(AudioChannelType.MUSIC, 0.3);

            // Enable input NOW so dialogue advance keys work
            Input.enableInput();
            return;
        }

        
        super.handleEvent(event);
    }

    

    protected handleEnteredLevelEnd(): void {
        if (!this.levelEndTimer.hasRun() && this.levelEndTimer.isStopped()) {
            this.emitter.fireEvent(GameEventType.STOP_SOUND, { key: Prologue.CUTSCENE_MUSIC_KEY });
            GameState.getInstance().markPrologueSeen();
            this.levelTransitionScreen.tweens.play("fadeIn");
        }
        this.emitter.fireEvent(GameEventType.STOP_SOUND, { key: this.levelMusicKey });
    }

    // ── Cutscene setup ────────────────────────────────────────────

    private initializeCutscene(): void {
        const ctrl = this.player._ai as PlayerController;

        this.cryoGreninjaSprite = this.add.animatedSprite(
            Prologue.CRYO_GRENINJA_SPRITE_KEY,
            MBLayers.PRIMARY
        ) as unknown as MBAnimatedSprite;

        this.cryoGreninjaSprite.position.set(
            Prologue.PLAYER_SPAWN.x,
            Prologue.PLAYER_SPAWN.y
        );
        this.cryoGreninjaSprite.animation.play("IDLE", true);
        this.cryoGreninjaSprite.visible = true;

        // Hide the real player — cryo-greninja stands in during cutscene
        this.player.visible = false;
        // Freeze movement (input itself is enabled so keys register)
        ctrl.isPaused = true;

        const lines = [
            PrologueLines.LINE_0,
            PrologueLines.LINE_1,
            PrologueLines.LINE_2,
            PrologueLines.LINE_3,
            PrologueLines.LINE_4,
        ];

        this.cutscene = new CutsceneSystem({
            scene:           this,
            uiLayerName:     MBLayers.UI,
            lines,
            iceSprite:       this.cryoGreninjaSprite as unknown as import("../../Wolfie2D/Nodes/Sprites/AnimatedSprite").default,
            pressesPerLayer: 2,
            totalLayers:     4,

            onPlayAudio: (key: string) => {
                this.emitter.fireEvent(GameEventType.PLAY_SOUND, {
                    key,
                    loop: false,
                    holdReference: false
                });
            },

           onFree: () => {
                this.cryoGreninjaSprite.visible = false;
                this.player.visible = true;
                ctrl.isPaused = false;

                new Timer(3000, () => {
                    this.emitter.fireEvent(GameEventType.STOP_SOUND, { key: Prologue.CUTSCENE_MUSIC_KEY });
                    this.levelTransitionScreen.tweens.play("fadeIn");
                }).start();
            },
        });

        this.cutscene.start();
        this.emitter.fireEvent(GameEventType.PLAY_SOUND, {
            key:           Prologue.CUTSCENE_MUSIC_KEY,
            loop:          true,
            holdReference: true,
        });
        AudioManager.setVolume(AudioChannelType.MUSIC, 0.3);
    }

    // ── Update ────────────────────────────────────────────────────

    public updateScene(deltaT: number): void {
        if (this.cutscene && this.cutscene.isActive) {
            this.cutscene.repositionTextbox();
            this.cutscene.update(deltaT);
        }
        super.updateScene(deltaT);
    }

    // ── Boilerplate ───────────────────────────────────────────────

    protected initializePKMN(): void { /* none */ }
    protected initializeEntities(): void { /* none in prologue */ }

    protected initializeViewport(): void {
        super.initializeViewport();
        this.viewport.setBounds(0, 0, 50 * 16, 40 * 16);
    }
}