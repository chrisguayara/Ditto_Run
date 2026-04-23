import AABB from "../../Wolfie2D/DataTypes/Shapes/AABB";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import GameEvent from "../../Wolfie2D/Events/GameEvent";
import { GameEventType } from "../../Wolfie2D/Events/GameEventType";
import Input from "../../Wolfie2D/Input/Input";
import { TweenableProperties } from "../../Wolfie2D/Nodes/GameNode";
import { GraphicType } from "../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Rect from "../../Wolfie2D/Nodes/Graphics/Rect";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import OrthogonalTilemap from "../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import RenderingManager from "../../Wolfie2D/Rendering/RenderingManager";
import Scene from "../../Wolfie2D/Scene/Scene";
import SceneManager from "../../Wolfie2D/Scene/SceneManager";
import Viewport from "../../Wolfie2D/SceneGraph/Viewport";
import Timer from "../../Wolfie2D/Timing/Timer";
import Color from "../../Wolfie2D/Utils/Color";
import { EaseFunctionType } from "../../Wolfie2D/Utils/EaseFunctions";
import PlayerController, { PlayerTweens, PlayerStates } from "../Player/PlayerController";
import PlayerWeapon from "../Player/PlayerWeapon";
import PhantumpWeapon from "../Player/PhantumpWeapon";
import SludgeWeapon from "../Player/SludgeWeapon";
import Particle from "../../Wolfie2D/Nodes/Graphics/Particle";
import { MBControls } from "../MBControls";
import { MBEvents } from "../MBEvents";
import { MBPhysicsGroups } from "../MBPhysicsGroups";
import MBFactoryManager from "../Factory/MBFactoryManager";
import MainMenu from "./MainMenu";
import Entity from "../Entity/Entity";
import MBAnimatedSprite from "../Nodes/MBAnimatedSprite";
/**
 * A const object for the layer names
 */
export const MBLayers = {
    PRIMARY: "PRIMARY",
    UI: "UI",
    PAUSE_BG: "PAUSE_BG", 
    PAUSE: "PAUSE"
} as const;

export type MBLayer = typeof MBLayers[keyof typeof MBLayers];

export default abstract class MBLevel extends Scene {
    /** Override the factory manager */
    public add: MBFactoryManager;

    // ── Pause menu assets ─────────────────────────────────────────
    public static readonly PAUSE_BG_KEY = "PAUSE_MENU_BG";
    public static readonly PAUSE_BG_PATH = "game_assets/spritesheets/pause.json";
    public static readonly MENU_BTN_KEY = "MENU_BUTTONS";
    public static readonly MENU_BTN_PATH = "game_assets/spritesheets/menubuttons.json";

    // ── Pause state ───────────────────────────────────────────────
    protected isPaused: boolean = false;
    protected selectedPauseOption: number = 0;
    // 0 = Resume, 1 = Restart, 2 = Quit
    protected pauseMenuBg!: AnimatedSprite;
    protected pauseButtonSprites!: AnimatedSprite[];
    private readonly PAUSE_IDLE_ANIMS = ["Resume_Idle", "Restart_Idle", "Quit_idle"];
    private readonly PAUSE_SELECTED_ANIMS = ["Resume_Selected", "Restart_Selected", "Quit_Selected"];

    // ── Weapon systems ────────────────────────────────────────────
    protected playerWeaponSystem!: PlayerWeapon;
    protected phantumpWeaponSystem!: PhantumpWeapon;
    protected originalWeaponSystem!: PlayerWeapon;
    protected sludgePool: SludgeWeapon[] = [];

    // ── Player ────────────────────────────────────────────────────
    protected playerSpriteKey!: string;
    protected player!: AnimatedSprite;
    protected playerSpawn!: Vec2;

    // ── UI ────────────────────────────────────────────────────────
    private healthLabel!: Label;
    private healthBar!: Label;
    private healthBarBg!: Label;
    private energyLabel!: Label;
    private energyBar!: Label;
    private energyBarBg!: Label;

    // ── UI Positions ──────────────────────────────────────────────
    protected healthBarPos: Vec2 = new Vec2(300, 20);
    protected energyBarPos: Vec2 = new Vec2(350, 20);
    private energyBarLeftEdge: number = 0;

    // ── Level end ─────────────────────────────────────────────────
    protected levelEndPosition!: Vec2;
    protected levelEndHalfSize!: Vec2;
    protected levelEndArea!: Rect;
    protected nextLevel!: new (...args: any) => Scene;
    protected levelEndTimer!: Timer;
    protected levelEndLabel!: Label;
    protected levelTransitionTimer!: Timer;
    protected levelTransitionScreen!: Rect;

    // ── Tilemap ───────────────────────────────────────────────────
    protected tilemapKey!: string;
    protected destructibleLayerKey!: string;
    protected wallsLayerKey!: string;
    protected phantomWallLayerKey!: string;
    protected damageWallLayerKey!: string;
    protected tilemapScale!: Vec2;
    protected destructable: OrthogonalTilemap | undefined;
    protected walls!: OrthogonalTilemap;
    protected phantomWalls!: OrthogonalTilemap;
    protected damageWalls!: OrthogonalTilemap;

    // ── Checkpoints ───────────────────────────────────────────────
    protected checkpoint_sqr1!: Vec2;
    protected checkpoint_sqr2!: Vec2;
    protected checkpointOneArea!: Rect;
    protected checkpointTwoArea!: Rect;
    protected respawnPosition!: Vec2;

    // ── Audio ─────────────────────────────────────────────────────
    protected levelMusicKey!: string;
    protected jumpAudioKey!: string;
    protected transformAudioKey!: string;
    protected levelEndAudioKey!: string;
    protected tileDestroyedAudioKey!: string;
    protected selectAudioKey!: string;

    // Entity Logic ---------------------------
    

    // Entity Logic ---------------------------
    

    public constructor(viewport: Viewport, sceneManager: SceneManager, renderingManager: RenderingManager, options: Record<string, any>) {
        super(viewport, sceneManager, renderingManager, {...options, physics: {
            groupNames: [
                MBPhysicsGroups.GROUND,
                MBPhysicsGroups.PLAYER,
                MBPhysicsGroups.PLAYER_PHANTUMP,
                MBPhysicsGroups.PLAYER_WEAPON,
                MBPhysicsGroups.DESTRUCTABLE,
                MBPhysicsGroups.PHANTOM_WALL,
                MBPhysicsGroups.DAMAGE_WALL,
                MBPhysicsGroups.ENTITY
            ],
            collisions:
            [
            //   GND  PLR  PHP  WPN  DST  PHT DMG ENT
                [0,   1,   1,   1,   0,   0, 0,   0],  // GROUND
                [1,   0,   0,   0,   1,   1, 1,   1],  // PLAYER - collides with phantom walls
                [1,   0,   0,   0,   1,   0, 1,   1],  // PLAYER_PHANTUMP - phases through phantom walls
                [1,   0,   0,   0,   1,   0, 0 ,  0],  // WEAPON
                [0,   1,   1,   1,   0,   0, 0 ,  0],  // DESTRUCTABLE
                [0,   1,   0,   0,   0,   0, 0,   0],// PHANTOM_WALL
                [0 ,  1,   1,   0,   0,   0, 0,   0],  // DAMAGE_WALL
                // Add ENTITY column and row — triggers only, no physics blocking except Snorlax
                [0 ,  1,   1,   0,   0,   0, 0, 0],  // ENTITY row
                // and add 0 or 1 to each existing row's last column
            ]
        }});
        this.add = new MBFactoryManager(this, this.tilemaps);
    }

    public loadPauseMenuAssets(): void {
        this.load.spritesheet(MBLevel.MENU_BTN_KEY, MBLevel.MENU_BTN_PATH);
        this.load.spritesheet(MBLevel.PAUSE_BG_KEY, MBLevel.PAUSE_BG_PATH);
    }

    public startScene(): void {
        this.initLayers();
        this.initializeTilemap();
        this.initializeWeaponSystem();
        this.initializeSludgePool();
        this.initializePlayer(this.playerSpriteKey);
        this.initializeViewport();
        this.subscribeToEvents();
        this.initializeUI();
        this.initializePauseMenu();
        this.initializeCheckpoints();
        this.initializeLevelEnds();

        this.levelTransitionTimer = new Timer(500);
        this.levelEndTimer = new Timer(3000, () => {
            this.levelTransitionScreen.tweens.play("fadeIn");
        });

        Input.disableInput();
        this.levelTransitionScreen.tweens.play("fadeOut");
        this.emitter.fireEvent(GameEventType.PLAY_SOUND, {
            key: this.levelMusicKey,
            loop: true,
            holdReference: true
        });
    }

    /* Update method for the scene */

    public updateScene(deltaT: number) {
        if (Input.isJustPressed(MBControls.PAUSE)) {
            this.isPaused ? this.resumeGame() : this.pauseGame();
            return;
        }

        if (this.isPaused) {
            this.updatePauseMenu();
            return;
        }

        while (this.receiver.hasNextEvent()) {
            this.handleEvent(this.receiver.getNextEvent());
        }
        // Tick all live sludge projectiles
        for (const s of this.sludgePool) {
            if (s.isAlive) s.update(deltaT);
        }
    }

    public fireSludge(origin: Vec2, direction: Vec2): void {
        const s = this.sludgePool.find(s => !s.isAlive);
        if (!s) return;
        s.fire(origin, direction, 900, this.destructable, this.playerWeaponSystem);
    }

    protected pauseGame(): void {
        this.isPaused = true;
        this.selectedPauseOption = 0;

        (this.player._ai as PlayerController).isPaused = true;

        this.repositionPauseMenu();
        this.pauseMenuBg.visible = true;
        this.pauseButtonSprites.forEach(b => b.visible = true);
        this.updatePauseButtonAnimations();
    }

    protected resumeGame(): void {
        this.isPaused = false;

        (this.player._ai as PlayerController).isPaused = false;

        this.pauseMenuBg.visible = false;
        this.pauseButtonSprites.forEach(b => b.visible = false);
    }

    protected updatePauseMenu(): void {
        this.repositionPauseMenu();

        if (Input.isJustPressed(MBControls.ATTACK_UP)) {
            this.selectedPauseOption = (this.selectedPauseOption - 1 + 3) % 3;
            this.updatePauseButtonAnimations();
        }

        if (Input.isJustPressed(MBControls.ATTACK_DOWN)) {
            this.selectedPauseOption = (this.selectedPauseOption + 1) % 3;
            this.updatePauseButtonAnimations();
        }

       if (Input.isJustPressed(MBControls.JUMP) 
            || Input.isJustPressed(MBControls.ATTACK)
            || Input.isJustPressed(MBControls.CONFIRM)) {  // ← add CONFIRM
            this.confirmPauseSelection();
        }
    }

    protected confirmPauseSelection(): void {
        switch (this.selectedPauseOption) {
            case 0: // Resume
                this.resumeGame();
                break;
            case 1: // Restart
                this.resumeGame();
                this.emitter.fireEvent(GameEventType.STOP_SOUND, { key: this.levelMusicKey });
                this.sceneManager.changeToScene(this.constructor as new (...args: any[]) => Scene);
                break;
            case 2: // Quit to Main Menu
                this.resumeGame();
                this.emitter.fireEvent(GameEventType.STOP_SOUND, { key: this.levelMusicKey });
                this.sceneManager.changeToScene(MainMenu);
                break;
        }
    }

    protected updatePauseButtonAnimations(): void {
        for (let i = 0; i < this.pauseButtonSprites.length; i++) {
            const anim = i === this.selectedPauseOption
                ? this.PAUSE_SELECTED_ANIMS[i]
                : this.PAUSE_IDLE_ANIMS[i];
            this.pauseButtonSprites[i].animation.playIfNotAlready(anim, true);
        }
    }

    protected getViewportCenter(): Vec2 {
        const zoom = this.getViewScale();
        const origin = this.viewport.getOrigin();
        return new Vec2(
            origin.x + (1200 / zoom) / 2,
            origin.y + (800 / zoom) / 2
        );
    }

    protected repositionPauseMenu(): void {
        const c = this.getViewportCenter();

        const bgScale = 1;
        this.pauseMenuBg.position.set(c.x, c.y);
        this.pauseMenuBg.scale.set(bgScale, bgScale);

        const btnScale = 1.5;
        const btnSpacing = 20;
        const totalH = (this.pauseButtonSprites.length - 1) * btnSpacing;
        const startY = c.y - totalH / 2;

        this.pauseButtonSprites.forEach((btn, i) => {
            btn.position.set(c.x, startY + i * btnSpacing);
            btn.scale.set(btnScale, btnScale);
        });
    }

    protected initializePauseMenu(): void {
        this.pauseButtonSprites = [];
        this.pauseMenuBg = this.add.animatedSprite(MBLevel.PAUSE_BG_KEY, MBLayers.PAUSE_BG); 
        this.pauseMenuBg.animation.play("IDLE", true);
        this.pauseMenuBg.visible = false;

        for (let i = 0; i < 3; i++) {
            const btn = this.add.animatedSprite(MBLevel.MENU_BTN_KEY, MBLayers.PAUSE);
            btn.animation.play(this.PAUSE_IDLE_ANIMS[i], true);
            btn.visible = false;
            this.pauseButtonSprites.push(btn);
        }

        this.repositionPauseMenu();
    }

    protected handleEvent(event: GameEvent): void {
        switch (event.type) {
            case MBEvents.PLAYER_ENTERED_LEVEL_END: {
                this.handleEnteredLevelEnd();
                break;
            }
            case MBEvents.LEVEL_START: {
                Input.enableInput();
                break;
            }
            case MBEvents.LEVEL_END: {
                this.emitter.fireEvent(GameEventType.STOP_SOUND, { key: this.levelMusicKey });
                this.emitter.fireEvent(GameEventType.PLAY_SOUND, { key: this.levelEndAudioKey });
                this.sceneManager.changeToScene(this.nextLevel);
                break;
            }
            case MBEvents.PARTICLE_HIT_DESTRUCTIBLE: {
                this.handleParticleHit(event.data.get("node"));
                break;
            }
            case MBEvents.HEALTH_CHANGE: {
                this.handleHealthChange(event.data.get("curhp"), event.data.get("maxhp"));
                break;
            }
            case MBEvents.PLAYER_DEAD: {
                const ctrl = this.player._ai as PlayerController;
                this.player.position.copy(this.respawnPosition);

                this.player.alpha = 1;
                this.player.rotation = 0;
                ctrl.health = ctrl.maxHealth;
                this.player.setGroup(MBPhysicsGroups.PLAYER);
                ctrl.velocity = Vec2.ZERO;
                ctrl.changeState(PlayerStates.IDLE);

                break;
            }
            case MBEvents.TRANSFORM_START: {
                const form = event.data.get("form");
                if (form === "PHANTUMP") {
                    // Swap to PLAYER_PHANTUMP group so phantom walls are passable
                    this.player.setGroup(MBPhysicsGroups.PLAYER_PHANTUMP);
                    // Swap to purple weapon
                    this.playerWeaponSystem.stopSystem();
                    this.playerWeaponSystem = this.phantumpWeaponSystem;
                }
                break;
            }
            case MBEvents.TRANSFORM_END: {
                this.player.setGroup(MBPhysicsGroups.PLAYER);
                this.playerWeaponSystem = this.originalWeaponSystem;
                break;
            }
            case MBEvents.ENERGY_CHANGE: {
                this.handleEnergyChange(event.data.get("cur"), event.data.get("max"));
                break;
            }
            case MBEvents.PLAYER_ENTERED_CHECKPOINT: {
                const nodeId = event.data.get("node");
                if (this.checkpointOneArea && nodeId === this.checkpointOneArea.id) {
                    this.respawnPosition = this.checkpoint_sqr1.clone();
                } else if (this.checkpointTwoArea && nodeId === this.checkpointTwoArea.id) {
                    this.respawnPosition = this.checkpoint_sqr2.clone();
                }
                break;
            }
            case MBEvents.PLAYER_HIT_DAMAGE_TILE: {
                const ctrl = this.player._ai as PlayerController;
                ctrl.health = 0;
                console.log("PLAYER_HIT!");
                break;
            }
            default: {
                throw new Error(`Unhandled event caught in scene with type ${event.type}`);
            }
        }
    }

    /* Handlers for the different events the scene is subscribed to */

    /**
     * Handle particle hit events
     * @param particleId the id of the particle
     */
    protected handleParticleHit(particleId: number): void {
        if (!this.destructable) return;

        let particles = this.playerWeaponSystem.getPool();
        let particle = particles.find(particle => particle.id === particleId);

        if (particle !== undefined) {
            let tilemap = this.destructable;
            let min = new Vec2(particle.sweptRect.left, particle.sweptRect.top);
            let max = new Vec2(particle.sweptRect.right, particle.sweptRect.bottom);

            let minIndex = tilemap.getColRowAt(min);
            let maxIndex = tilemap.getColRowAt(max);

            for (let col = minIndex.x; col <= maxIndex.x; col++) {
                for (let row = minIndex.y; row <= maxIndex.y; row++) {
                    if (tilemap.isTileCollidable(col, row) && this.particleHitTile(tilemap, particle, col, row)) {
                        tilemap.setTileAtRowCol(new Vec2(col, row), 0);
                        this.emitter.fireEvent(GameEventType.PLAY_SOUND, {
                            key: this.tileDestroyedAudioKey,
                            loop: false,
                            holdReference: false
                        });
                    }
                }
            }
        }
    }

    protected initializeSludgePool(): void {
        for (let i = 0; i < 5; i++) {
            const sprite = this.add.animatedSprite(SludgeWeapon.SLUDGE_KEY, MBLayers.PRIMARY);
            sprite.visible = false;
            const s = new SludgeWeapon(sprite);
            this.sludgePool.push(s);
        }
    }

    protected particleHitTile(tilemap: OrthogonalTilemap, particle: Particle, col: number, row: number): boolean {
        let tileSize = tilemap.getTileSize();
        let tilePos = new Vec2(col * tileSize.x + tileSize.x / 2, row * tileSize.y + tileSize.y / 2);
        let collider = new AABB(tilePos, tileSize.scaled(1 / 2));
        return particle.sweptRect.overlapArea(collider) > 0;
    }

    /**
     * Handle the event when the player enters the level end area.
     */
    protected handleEnteredLevelEnd(): void {
        if (!this.levelEndTimer.hasRun() && this.levelEndTimer.isStopped()) {
            this.levelEndTimer.start();
            this.levelEndLabel.tweens.play("slideIn");
        }
    }

    protected handleHealthChange(currentHealth: number, maxHealth: number): void {
        let unit = this.healthBarBg.size.x / maxHealth;
        this.healthBar.size.set(this.healthBarBg.size.x - unit * (maxHealth - currentHealth), this.healthBarBg.size.y);
        this.healthBar.position.set(
            this.healthBarBg.position.x - (unit / 2 / this.getViewScale()) * (maxHealth - currentHealth),
            this.healthBarBg.position.y
        );
        this.healthBar.backgroundColor =
            currentHealth < maxHealth * 1 / 4 ? Color.RED :
            currentHealth < maxHealth * 3 / 4 ? Color.YELLOW :
            Color.GREEN;
    }

    protected handleEnergyChange(currentEnergy: number, maxEnergy: number): void {
        const maxWidth = 100;
        const newWidth = (currentEnergy / maxEnergy) * maxWidth;
        this.energyBar.size.set(newWidth, 10);
        this.energyBar.position.set(this.energyBarLeftEdge + newWidth / 2, this.energyBarBg.position.y);
        this.energyBar.backgroundColor = currentEnergy < maxEnergy * 0.25 ? Color.RED : Color.BLUE;
    }

    /* Initialization methods for everything in the scene */

    /**
     * Initialzes the layers
     */
    protected initLayers(): void {
        this.addUILayer(MBLayers.UI);
        this.addLayer(MBLayers.PRIMARY);
        this.addLayer(MBLayers.PAUSE_BG); 
        this.addLayer(MBLayers.PAUSE);
    }

    protected initializeTilemap(): void {
        if (this.tilemapKey === undefined || this.tilemapScale === undefined) {
            throw new Error("Cannot add tilemap unless the tilemap key and scale are set.");
        }

        this.add.tilemap(this.tilemapKey, this.tilemapScale);

        if (this.wallsLayerKey === undefined) {
            throw new Error("Make sure the key for the wall layer is set");
        }

        // Get the wall and destructible layers 
        this.walls = this.getTilemap(this.wallsLayerKey) as OrthogonalTilemap;

        
        // Phantom walls independent of destructible layer
        if (this.phantomWallLayerKey !== undefined) {
            this.phantomWalls = this.getTilemap(this.phantomWallLayerKey) as OrthogonalTilemap;
            if (this.phantomWalls) {
                this.phantomWalls.addPhysics();
                this.phantomWalls.setGroup(MBPhysicsGroups.PHANTOM_WALL);
            }
        }

        if (this.damageWallLayerKey !== undefined) {
            this.damageWalls = this.getTilemap(this.damageWallLayerKey) as OrthogonalTilemap;
            if (this.damageWalls) {
                this.damageWalls.addPhysics();
                this.damageWalls.setGroup(MBPhysicsGroups.DAMAGE_WALL);
                this.damageWalls.setTrigger(MBPhysicsGroups.PLAYER, MBEvents.PLAYER_HIT_DAMAGE_TILE, "");
                this.damageWalls.setTrigger(MBPhysicsGroups.PLAYER_PHANTUMP, MBEvents.PLAYER_HIT_DAMAGE_TILE, "");
            }
        }

        if (this.destructibleLayerKey !== undefined) {
            this.destructable = this.getTilemap(this.destructibleLayerKey) as OrthogonalTilemap;
            if (this.destructable) {
                this.destructable.addPhysics();
                this.destructable.setGroup(MBPhysicsGroups.DESTRUCTABLE);
                this.destructable.setTrigger(MBPhysicsGroups.PLAYER_WEAPON, MBEvents.PARTICLE_HIT_DESTRUCTIBLE, "");
            }
        }
    }

    protected subscribeToEvents(): void {
        this.receiver.subscribe(MBEvents.PLAYER_ENTERED_LEVEL_END);
        this.receiver.subscribe(MBEvents.LEVEL_START);
        this.receiver.subscribe(MBEvents.LEVEL_END);
        this.receiver.subscribe(MBEvents.PARTICLE_HIT_DESTRUCTIBLE);
        this.receiver.subscribe(MBEvents.HEALTH_CHANGE);
        this.receiver.subscribe(MBEvents.PLAYER_DEAD);
        this.receiver.subscribe(MBEvents.TRANSFORM_START);
        this.receiver.subscribe(MBEvents.TRANSFORM_END);
        this.receiver.subscribe(MBEvents.ENERGY_CHANGE);
        this.receiver.subscribe(MBEvents.PLAYER_ENTERED_CHECKPOINT);
        this.receiver.subscribe(MBEvents.PLAYER_HIT_DAMAGE_TILE);
    }

    protected initializeUI(): void {
        const PAD = 16;

        this.energyLabel = <Label>this.add.uiElement(UIElementType.LABEL, MBLayers.UI, {
            position: new Vec2(PAD + 30, PAD + 44),
            text: "EP"
        });
        this.energyLabel.textColor = Color.WHITE;
        this.energyLabel.fontSize = 12;
        this.energyLabel.font = "Courier";

        this.energyBarBg = <Label>this.add.uiElement(UIElementType.LABEL, MBLayers.UI, {
            position: new Vec2(PAD + 80, PAD + 44),
            text: ""
        });
        this.energyBarBg.size = new Vec2(100, 10);
        this.energyBarBg.borderColor = Color.WHITE;
        this.energyBarBg.backgroundColor = new Color(0, 0, 0, 0.5);

        const EP_CENTER_X = PAD + 80;
        const EP_MAX_WIDTH = 100;
        this.energyBarLeftEdge = EP_CENTER_X - EP_MAX_WIDTH / 2;

        this.energyBar = <Label>this.add.uiElement(UIElementType.LABEL, MBLayers.UI, {
            position: new Vec2(EP_CENTER_X, PAD + 44),
            text: ""
        });
        this.energyBar.size = new Vec2(EP_MAX_WIDTH, 10);
        this.energyBar.backgroundColor = Color.BLUE;

        this.healthLabel = <Label>this.add.uiElement(UIElementType.LABEL, MBLayers.UI, {
            position: new Vec2(10, this.healthBarPos.y),
            text: "HP "
        });
        this.healthLabel.size.set(300, 30);
        this.healthLabel.fontSize = 24;
        this.healthLabel.font = "Courier";

        this.healthBar = <Label>this.add.uiElement(UIElementType.LABEL, MBLayers.UI, {
            position: this.healthBarPos,
            text: ""
        });
        this.healthBar.size = new Vec2(300, 25);
        this.healthBar.backgroundColor = Color.GREEN;

        this.healthBarBg = <Label>this.add.uiElement(UIElementType.LABEL, MBLayers.UI, {
            position: this.healthBarPos,
            text: ""
        });
        this.healthBarBg.size = new Vec2(300, 25);
        this.healthBarBg.borderColor = Color.BLACK;

        this.levelEndLabel = <Label>this.add.uiElement(UIElementType.LABEL, MBLayers.UI, {
            position: new Vec2(-300, 100),
            text: "Level Complete"
        });
        this.levelEndLabel.size.set(1200, 60);
        this.levelEndLabel.borderRadius = 0;
        this.levelEndLabel.backgroundColor = new Color(34, 32, 52);
        this.levelEndLabel.textColor = Color.WHITE;
        this.levelEndLabel.fontSize = 48;
        this.levelEndLabel.font = "PixelSimple";

        this.levelEndLabel.tweens.add("slideIn", {
            startDelay: 0,
            duration: 1000,
            effects: [
                {
                    property: TweenableProperties.posX,
                    start: -300,
                    end: 300,
                    ease: EaseFunctionType.OUT_SINE
                }
            ]
        });

        this.levelTransitionScreen = <Rect>this.add.graphic(GraphicType.RECT, MBLayers.UI, {
            position: new Vec2(300, 200),
            size: new Vec2(600, 400)
        });
        this.levelTransitionScreen.color = new Color(34, 32, 52);
        this.levelTransitionScreen.alpha = 1;

        this.levelTransitionScreen.tweens.add("fadeIn", {
            startDelay: 0,
            duration: 1000,
            effects: [
                {
                    property: TweenableProperties.alpha,
                    start: 0,
                    end: 1,
                    ease: EaseFunctionType.IN_OUT_QUAD
                }
            ],
            onEnd: MBEvents.LEVEL_END
        });

        this.levelTransitionScreen.tweens.add("fadeOut", {
            startDelay: 0,
            duration: 1000,
            effects: [
                {
                    property: TweenableProperties.alpha,
                    start: 1,
                    end: 0,
                    ease: EaseFunctionType.IN_OUT_QUAD
                }
            ],
            onEnd: MBEvents.LEVEL_START
        });
    }

    protected initializeWeaponSystem(): void {
        this.playerWeaponSystem = new PlayerWeapon(200, Vec2.ZERO, 1000, 3, 0, 50);
        this.playerWeaponSystem.initializePool(this, MBLayers.PRIMARY);
        this.originalWeaponSystem = this.playerWeaponSystem;

        this.phantumpWeaponSystem = new PhantumpWeapon(200, Vec2.ZERO, 1000, 3, 0, 50);
        this.phantumpWeaponSystem.initializePool(this, MBLayers.PRIMARY);

        if (this.walls) {
            this.playerWeaponSystem.setTilemap(this.walls);
            this.phantumpWeaponSystem.setTilemap(this.walls);
        }
    }

    protected initializePlayer(key: string): void {
        if (this.playerWeaponSystem === undefined) {
            throw new Error("Player weapon system must be initialized before initializing the player!");
        }
        if (this.playerSpawn === undefined) {
            throw new Error("Player spawn must be set before initializing the player!");
        }

        this.player = this.add.animatedSprite(key, MBLayers.PRIMARY);
        this.player.scale.set(1, 1);
        this.player.position.copy(this.playerSpawn);

        this.player.addPhysics(new AABB(this.player.position.clone(), new Vec2(6, 8)));
        this.player.setGroup(MBPhysicsGroups.PLAYER);

        this.player.tweens.add(PlayerTweens.FLIP, {
            startDelay: 0,
            duration: 500,
            effects: [
                {
                    property: "rotation",
                    start: 0,
                    end: 2 * Math.PI,
                    ease: EaseFunctionType.IN_OUT_QUAD
                }
            ]
        });

        this.player.tweens.add(PlayerTweens.DEATH, {
            startDelay: 0,
            duration: 500,
            effects: [
                {
                    property: "rotation",
                    start: 0,
                    end: Math.PI,
                    ease: EaseFunctionType.IN_OUT_QUAD
                },
                {
                    property: "alpha",
                    start: 1,
                    end: 0,
                    ease: EaseFunctionType.IN_OUT_QUAD
                }
            ],
            onEnd: MBEvents.PLAYER_DEAD
        });

        this.player.addAI(PlayerController, {
            weaponSystem: this.playerWeaponSystem,
            tilemap: this.destructibleLayerKey ?? this.wallsLayerKey
        });
    }

    protected initializeViewport(): void {
        if (this.player === undefined) {
            throw new Error("Player must be initialized before setting the viewport to follow the player");
        }

        this.viewport.follow(this.player);
        this.viewport.setZoomLevel(3);
        this.viewport.setBounds(0, 0, 960, 960);
    }

    protected initializeLevelEnds(): void {
        if (!this.layers.has(MBLayers.PRIMARY)) {
            throw new Error("Can't initialize the level ends until the primary layer has been added to the scene!");
        }

        this.levelEndArea = <Rect>this.add.graphic(GraphicType.RECT, MBLayers.PRIMARY, {
            position: this.levelEndPosition,
            size: this.levelEndHalfSize
        });
        this.levelEndArea.addPhysics(undefined, undefined, false, true);
        this.levelEndArea.setTrigger(MBPhysicsGroups.PLAYER, MBEvents.PLAYER_ENTERED_LEVEL_END, "");
        this.levelEndArea.color = new Color(255, 0, 255, .20);
    }

    protected initializeCheckpoints(): void {
        if (!this.layers.has(MBLayers.PRIMARY)) return;

        if (this.checkpoint_sqr1) {
            this.checkpointOneArea = <Rect>this.add.graphic(GraphicType.RECT, MBLayers.PRIMARY, {
                position: this.checkpoint_sqr1,
                size: this.levelEndHalfSize
            });
            this.checkpointOneArea.addPhysics(undefined, undefined, false, true);
            this.checkpointOneArea.setTrigger(MBPhysicsGroups.PLAYER, MBEvents.PLAYER_ENTERED_CHECKPOINT, "");
            this.checkpointOneArea.color = new Color(255, 255, 0, 0.20);
        }

        if (this.checkpoint_sqr2) {
            this.checkpointTwoArea = <Rect>this.add.graphic(GraphicType.RECT, MBLayers.PRIMARY, {
                position: this.checkpoint_sqr2,
                size: this.levelEndHalfSize
            });
            this.checkpointTwoArea.addPhysics(undefined, undefined, false, true);
            this.checkpointTwoArea.setTrigger(MBPhysicsGroups.PLAYER, MBEvents.PLAYER_ENTERED_CHECKPOINT, "");
            this.checkpointTwoArea.color = new Color(255, 255, 0, 0.20);
        }
    }

    public getJumpAudioKey(): string {
        return this.jumpAudioKey;
    }

    public getTransformAudioKey(): string {
        return this.transformAudioKey;
    }

    protected entities: Entity[] = [];

    protected spawnEntity(
        EntityClass: new (sprite: MBAnimatedSprite) => Entity,
        spriteKey: string,
        position: Vec2,
        collidable: boolean = false  // true = solid, false = trigger only
    ): Entity {
        const sprite = this.add.animatedSprite(spriteKey, MBLayers.PRIMARY);
        sprite.position.copy(position);
        sprite.animation.play("IDLE", true);
        sprite.addPhysics(new AABB(Vec2.ZERO, new Vec2(8, 8)), undefined, collidable, !collidable);
        sprite.setGroup(MBPhysicsGroups.ENTITY);
        sprite.setTrigger(MBPhysicsGroups.PLAYER, MBEvents.PLAYER_HIT_ENTITY, "");

        const entity = new EntityClass(sprite);
        
        this.entityMap.set(sprite.id, entity);
        this.entities.push(entity);
        return entity;
    }

    protected entityMap: Map<number, Entity> = new Map();
}