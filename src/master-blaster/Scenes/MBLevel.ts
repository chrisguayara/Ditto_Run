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
import PokemonController from "../Pokemon/PokemonController";
import MBAnimatedSprite from "../Nodes/MBAnimatedSprite";
import Game from "../../Wolfie2D/Loop/Game";
import { Transformations } from "../Player/Transformation";

import { DittoForms } from "../UI/DittoForms";
import AudioManager from "../../Wolfie2D/Sound/AudioManager";
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
    protected controlsLabelOffsets: Vec2[] = [];
    private readonly PAUSE_IDLE_ANIMS = ["Resume_Idle", "Restart_Idle",  "Help_Idle", "Controls_Idle","Quit_idle"];
    private readonly PAUSE_SELECTED_ANIMS = ["Resume_Selected", "Restart_Selected",  "Help_Selected", "Controls_Selected","Quit_Selected"];

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
    protected UI_transformationSprite!: AnimatedSprite;
    protected UI_escapeSprite!: AnimatedSprite;
    public static readonly ESCAPE_OVERLAY_PATH = "game_assets/spritesheets/ui/escape.json";
    public static readonly ESCAPE_OVERLAY_KEY = "escapeOverlay";
    protected transformUIkey!: string ;
    protected transformUIpath!: string ;
    protected transformCurrentForm: string | null = "Ditto";


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
    
    protected hintsVisible: boolean = false;
    protected controlsUIVisible: boolean = false;
    protected tilemapScale!: Vec2;
    protected destructable!: OrthogonalTilemap;
    protected walls!: OrthogonalTilemap;
    protected phantomWalls!: OrthogonalTilemap;
    protected damageWalls!: OrthogonalTilemap;
    protected hintSprites: AnimatedSprite[] = [];
    protected hintSpriteKey!: string;
    protected hintSpritePath!: string;

    protected showingControlsScreen: boolean = false;
    protected controlsLabels: Label[] = [];
    protected controlsSelectedBack: number = 0;
    
    
    

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
    protected selectAudioPath!: string;

    public canUpdateTransform : boolean = true;
    private levelTimer: number = 0;
    private timerLabel!: Label;
    private timerRunning: boolean = false;

    // ── Controls screen ───────────────────────────────────────────
    private showingControls: boolean = false;

    public selectKey!: string;
    protected idleTimeThreshold: number = 5; // seconds
    private idleTimer: number = 0;
    private escOverlayShowing: boolean = false;

    // Entity Logic ---------------------------
    

    // Entity Logic ---------------------------
    

    protected entities: Entity[] = [];
    protected spawnPokemon(
        ControllerClass: new () => PokemonController,
        spriteKey: string,
        position: Vec2,
        options: Record<string, any> = {}
    ): PokemonController {
        const sprite = this.add.animatedSprite(spriteKey, MBLayers.PRIMARY);
        sprite.position.copy(position);
        sprite.animation.play("IDLE", true);

        // Solid hitbox — Pokemon stand on the ground
        sprite.addPhysics(new AABB(Vec2.ZERO, new Vec2(8, 8)), undefined, false, true);
        sprite.setGroup(MBPhysicsGroups.ENTITY);

        // Trigger 1: player body contact (existing — for bumping into them)
        sprite.setTrigger(MBPhysicsGroups.PLAYER, MBEvents.PLAYER_HIT_ENTITY, "");

        // Trigger 2: weapon particles → fires POKEMON_HIT with this sprite's id
        sprite.setTrigger(MBPhysicsGroups.PLAYER_WEAPON, MBEvents.POKEMON_HIT, "");

        // Attach the AI controller
        sprite.addAI(ControllerClass, {
            playerRef: this.player,         
            patrolLeft:  position.x - 100,
            patrolRight: position.x + 100,
            ...options
        });

        const controller = sprite.ai as PokemonController;
        this.pokemonMap.set(sprite.id, controller);
        return controller;
    }
    

    protected entityMap: Map<number, Entity> = new Map();
    protected pokemonMap: Map<number, PokemonController> = new Map();

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
                MBPhysicsGroups.ENTITY,
                MBPhysicsGroups.ROTOM
            ],
            collisions:
            [
            //   GND  PLR  PHP  WPN  DST  PHT DMG ENT
                [0,   1,   1,   1,   0,   0, 0,   0, 0],  // GROUND
                [1,   0,   0,   0,   1,   1, 1,   1, 0],  // PLAYER - collides with phantom walls
                [1,   0,   0,   0,   1,   0, 1,   1, 0 ],  // PLAYER_PHANTUMP - phases through phantom walls
                [1,   0,   0,   0,   1,   0, 0 ,  0, 0],  // WEAPON
                [0,   1,   1,   1,   0,   0, 0 ,  0, 0 ],  // DESTRUCTABLE
                [0,   1,   0,   0,   0,   0, 0,   0, 0],// PHANTOM_WALL
                [0 ,  1,   1,   0,   0,   0, 0,   0, 0],  // DAMAGE_WALL
                // Add ENTITY column and row — triggers only, no physics blocking except Snorlax
                [0 ,  1,   1,   0,   0,   0, 0,    0,   0],
                [0,   0,   0,   0,   0,   0, 0 , 0 ,0]  // ENTITY row
                // and add 0 or 1 to each existing row's last column
            ]
        }});
        this.add = new MBFactoryManager(this, this.tilemaps);

        this.selectAudioKey = "SELECT_AUDIO_KEY";
        this.selectAudioPath = "game_assets/sounds/switch.wav";

        this.hintSpriteKey = "HINT_SPRITE_KEY";
        this.hintSpritePath = "game_assets/spritesheets/hints/hintsheet.json";

        this.transformUIkey = "TRANSFORM_UI_KEY";
        this.transformUIpath = "game_assets/spritesheets/ui/transformRing.json";

        this.load.spritesheet(MBLevel.ESCAPE_OVERLAY_KEY, MBLevel.ESCAPE_OVERLAY_PATH);

        

        
    }

    public loadPauseMenuAssets(): void {
        
        this.load.spritesheet(MBLevel.PAUSE_BG_KEY, MBLevel.PAUSE_BG_PATH);
        this.load.spritesheet(MBLevel.MENU_BTN_KEY, MBLevel.MENU_BTN_PATH);
        
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
        this.levelEndTimer = new Timer(1200, () => {
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
        if (this.timerRunning && !this.isPaused) {
            this.levelTimer += deltaT;
            const mins = Math.floor(this.levelTimer / 60);
            const secs = Math.floor(this.levelTimer % 60);
            const ms   = Math.floor((this.levelTimer % 1) * 100);
            this.timerLabel.text = `${mins}:${secs.toString()}:${ms.toString()}`;
        }
        

        
        if (Input.isJustPressed(MBControls.PAUSE)) {
            this.isPaused ? this.resumeGame() : this.pauseGame();
            return;
        }

        if (this.isPaused) {
            this.updatePauseMenu();

            return;
        }
        const playerMoving =
        Input.isPressed(MBControls.MOVE_LEFT)  ||
        Input.isPressed(MBControls.MOVE_RIGHT) ||
        Input.isJustPressed(MBControls.JUMP)   ||
        Input.isJustPressed(MBControls.ATTACK);

        if (playerMoving) {
            this.idleTimer = 0;
            if (this.escOverlayShowing) {
                this.escOverlayShowing = false;
                this.UI_escapeSprite.tweens.play("fadeOut");
            }
        } else if (!this.isPaused) {
            this.idleTimer += deltaT;
            if (this.idleTimer >= this.idleTimeThreshold && !this.escOverlayShowing) {
                this.escOverlayShowing = true;
                this.UI_escapeSprite.tweens.play("fadeIn");
            }
        }

        while (this.receiver.hasNextEvent()) {
            this.handleEvent(this.receiver.getNextEvent());
        }
        // Tick all live sludge projectiles
        for (const s of this.sludgePool) {
            if (s.isAlive) s.update(deltaT);
        }

        // Update all entities
        for (const entity of this.entities) {
            (entity as any).update?.(deltaT);
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
        this.showingControlsScreen = false;
        this.controlsLabels.forEach(l => l.visible = false);
        (this.player._ai as PlayerController).isPaused = false;
        this.pauseMenuBg.visible = false;
        this.pauseButtonSprites.forEach(b => b.visible = false);
    }

    protected updatePauseMenu(): void {
        this.repositionPauseMenu();
    
        if (this.showingControlsScreen) {
            this.repositionControlsLabels();
            // Only one action: back
            if (Input.isJustPressed(MBControls.ATTACK)
                || Input.isJustPressed(MBControls.CONFIRM)
                || Input.isJustPressed(MBControls.PAUSE)) {
                this.showingControlsScreen = false;
                this.controlsLabels.forEach(l => l.visible = false);
                this.pauseButtonSprites.forEach(b => b.visible = true);
                this.updatePauseButtonAnimations();
            }
            return; // don't process normal pause nav
        }
    
        // ... rest of existing updatePauseMenu nav code unchanged
        if (Input.isJustPressed(MBControls.JUMP) || Input.isJustPressed(MBControls.ATTACK_UP)) {
            this.selectedPauseOption = (this.selectedPauseOption - 1 + 5) % 5;
            this.updatePauseButtonAnimations();
        }
        if (Input.isJustPressed(MBControls.DOWN) || Input.isJustPressed(MBControls.ATTACK_DOWN)) {
            this.selectedPauseOption = (this.selectedPauseOption + 1) % 5;
            this.updatePauseButtonAnimations();
        }
        if (Input.isJustPressed(MBControls.ATTACK) || Input.isJustPressed(MBControls.CONFIRM)) {
            this.confirmPauseSelection();
        }
    }
    protected repositionControlsLabels(): void {
        const screen = this.viewport.getHalfSize().scaled(2);
        const cx = screen.x / 2;
        const cy = screen.y / 2;
        this.controlsLabels.forEach((lbl, i) => {
            const off = this.controlsLabelOffsets[i];
            lbl.position.set(cx + off.x, cy + off.y);
        });
    }
    

    protected confirmPauseSelection(): void {
        switch (this.selectedPauseOption) {
            case 0: // Resume
                this.resumeGame();
                this.emitter.fireEvent(GameEventType.PLAY_SOUND, {key: this.selectAudioKey});
                break;
            case 1: // Restart
                this.resumeGame();
                this.emitter.fireEvent(GameEventType.PLAY_SOUND, {key: this.selectAudioKey});
                this.emitter.fireEvent(GameEventType.STOP_SOUND, { key: this.levelMusicKey });
                this.sceneManager.changeToScene(this.constructor as new (...args: any[]) => Scene);
                break;
            case 2: // Hints()
                this.resumeGame();
                this.hintsVisible = !this.hintsVisible;
                
                for (const s of this.hintSprites) {
                    s.visible = this.hintsVisible;
                }
                this.emitter.fireEvent(GameEventType.PLAY_SOUND, { key: this.selectAudioKey });
                break;
            case 3: // Controls
                this.emitter.fireEvent(GameEventType.PLAY_SOUND, { key: this.selectAudioKey });
                this.showingControlsScreen = true;
                // Hide pause buttons, show controls labels (bg stays visible)
                this.pauseButtonSprites.forEach(b => b.visible = false);
                this.repositionControlsLabels();
                this.controlsLabels.forEach(l => l.visible = true);
                break;
            case 4: // Quit to Main Menu
                this.resumeGame();
                this.emitter.fireEvent(GameEventType.PLAY_SOUND, {key: this.selectAudioKey});
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
    // protected getClickedPauseButton(mousePos: Vec2): number {
    //     const size = this.viewport.getHalfSize().scaled(2);
    //     const center = size.scaled(0.5);
    //     const zoom = this.viewport.getZoomLevel();
    //     const btnSpacing = 60/zoom;
    //     const totalHeight = (this.pauseButtonSprites.length - 1) * btnSpacing;
    //     const startY = center.y - totalHeight / 2;

    //     // Check each button's position
    //     for (let i = 0; i < this.pauseButtonSprites.length; i++) {
    //         const btnY = startY + i * btnSpacing;
    //         const btn = this.pauseButtonSprites[i];
            
    //         // Base sprite is 48px, but make hitbox more generous
    //         const btnHalfWidth = 25 ;  
    //         const btnHalfHeight = 15; 
            
    //         if (mousePos.x >= center.x - btnHalfWidth && 
    //             mousePos.x <= center.x + btnHalfWidth &&
    //             mousePos.y >= btnY - btnHalfHeight && 
    //             mousePos.y <= btnY + btnHalfHeight) {
    //             return i;
    //         }
    //     }
        
    //     return -1; // No button clicked
    // }

    protected updateUI(): void {
        // transform circle

        const ctrl = this.player._ai as PlayerController;
        const activeForm = ctrl.transformations.selectedForm;
        
        if(!activeForm){
            this.UI_transformationSprite.animation.playIfNotAlready(DittoForms.DITTO, true);
            this.canUpdateTransform = true;
            return;
        }
        const formName = activeForm.displayName;

        switch(formName){
            case DittoForms.CHARIZARD:
                // this.UI_transformationSprite.animation.playIfNotAlready(DittoForms.CHARIZARD, true);
                console.log(formName);
                break;
            case DittoForms.GRENINJA:
                this.UI_transformationSprite.animation.playIfNotAlready(DittoForms.GRENINJA, true);
                console.log(formName);
                break;
            default:
                this.UI_transformationSprite.animation.playIfNotAlready(DittoForms.DITTO, true);
                console.log(formName);
                break;

        }
        this.canUpdateTransform = true;
    }

    protected getViewportCenter(): Vec2 {
        const size = this.viewport.getHalfSize().scaled(2);
        return new Vec2(size.x / 2, size.y / 2);
    }

    protected repositionPauseMenu(): void {
        const size = this.viewport.getHalfSize().scaled(2);
        const center = size.scaled(0.5);

        const zoom = this.viewport.getZoomLevel(); 

        this.pauseMenuBg.position.set(center.x, center.y-15);
        this.pauseMenuBg.scale.set(1, 1);

        const baseSpriteHeight = 48;
        const baseScale = (1 / zoom); 

        const btnScale = baseScale; 

        const btnSpacing = 60 / zoom; 

        const totalHeight = (this.pauseButtonSprites.length - 1) * btnSpacing;
        const startY = center.y - totalHeight / 2;

        this.pauseButtonSprites.forEach((btn, i) => {
            btn.position.set(center.x, startY + i * btnSpacing);
            btn.scale.set(btnScale, btnScale);
        });
    }

    protected initializePauseMenu(): void {
        this.pauseButtonSprites = [];
        this.pauseMenuBg = this.add.animatedSprite(MBLevel.PAUSE_BG_KEY, MBLayers.PAUSE_BG);
        this.pauseMenuBg.animation.play("IDLE", true);
        this.pauseMenuBg.visible = false;
    
        for (let i = 0; i < 5; i++) {
            const btn = this.add.animatedSprite(MBLevel.MENU_BTN_KEY, MBLayers.PAUSE);
            btn.animation.play(this.PAUSE_IDLE_ANIMS[i], true);
            btn.visible = false;
            this.pauseButtonSprites.push(btn);
        }
    
        this.repositionPauseMenu();
        this.initializeControlsScreen(); // <-- add this
    }
    protected initializeControlsScreen(): void {
    const screen = this.viewport.getHalfSize().scaled(2);
    const cx = screen.x / 2 -400;
    const cy = screen.y / 2 -400;

    type Row =
        | { kind: "title" | "sep" | "back"; text: string }
        | { kind: "header"; text: string }
        | { kind: "row"; action: string; key: string };

    const layout: Row[] = [
        { kind: "title",  text: "CONTROLS" },
        { kind: "header", text: "MOVEMENT" },
        { kind: "row",    action: "Move",       key: "A / D" },
        { kind: "row",    action: "Jump",        key: "W" },
        { kind: "header", text: "COMBAT" },
        { kind: "row",    action: "GRAPPLE",      key: "Left Mouse" },
        { kind: "header", text: "TRANSFORM" },
        { kind: "row",    action: "Transform",   key: "E" },
        { kind: "header", text: "MENU" },
        { kind: "row",    action: "Pause/Unpause",       key: "Esc" },
    ];

    const TITLE_H = 14, SEP_H = 10, HEADER_H = 14, ROW_H = 12;
    const GAP_TITLE = 0, GAP_SEP = 0, GAP_GROUP = 0, BACK_MARGIN = 0;

    // First pass: measure total height so we can center it
    let totalH = 0;
    for (let i = 0; i < layout.length; i++) {
        const item = layout[i];
        if      (item.kind === "title")  totalH += TITLE_H + GAP_TITLE;
        else if (item.kind === "sep")    totalH += SEP_H + GAP_SEP;
        else if (item.kind === "header") {
            if (i > 0 && layout[i - 1].kind === "row") totalH += GAP_GROUP;
            totalH += HEADER_H;
        }
        else if (item.kind === "row")    totalH += ROW_H;
    }

    const YELLOW = Color.YELLOW;
    const WHITE  = Color.WHITE;
    const CYAN   = new Color(100, 220, 255);
    const GRAY   = new Color(160, 160, 160);

    const addLabel = (text: string, xOff: number, yOff: number, color: Color, fontSize: number) => {
        const lbl = <Label>this.add.uiElement(UIElementType.LABEL, MBLayers.PAUSE, {
            position: new Vec2(cx + xOff, cy + yOff),
            text
        });
        lbl.textColor = color;
        lbl.fontSize = fontSize;
        lbl.font = "monospace";
        lbl.backgroundColor = new Color(0, 0, 0, 0);
        lbl.visible = false;
        this.controlsLabels.push(lbl);
        this.controlsLabelOffsets.push(new Vec2(xOff, yOff));
    };

    // Second pass: create labels, walking y from the top of the centered block
    let y = -totalH / 2 -20;
    for (let i = 0; i < layout.length; i++) {
        const item = layout[i];
        if (item.kind === "title") {
            addLabel(item.text, -10, y, CYAN, 26);
            y += TITLE_H + GAP_TITLE;
        } else if (item.kind === "sep") {
            addLabel(item.text, 0, y, GRAY, 16);
            y += SEP_H + GAP_SEP;
        } else if (item.kind === "header") {
            if (i > 0 && layout[i - 1].kind === "row") y += GAP_GROUP;
            addLabel(item.text, -10, y, YELLOW, 20);
            y += HEADER_H;
        } else if (item.kind === "row") {
            addLabel(item.action, -30, y, WHITE, 16);
            addLabel(item.key,    38,  y, CYAN,  16);
            y += ROW_H;
        } else if (item.kind === "back") {
            y += BACK_MARGIN;
            addLabel(item.text, -10, y, YELLOW, 20);
        }
    }
}
    protected handleEvent(event: GameEvent): void {
        switch (event.type) {
            case MBEvents.PLAYER_ENTERED_LEVEL_END: {
                this.handleEnteredLevelEnd();
                break;
            }
            case MBEvents.LEVEL_START: {
                this.timerRunning = true;
                const ctrl = this.player._ai as PlayerController;
                this.handleHealthChange(ctrl.health, ctrl.maxHealth);
                
                Input.enableInput();
                break;
            }
            
            case MBEvents.LEVEL_END: {
                this.timerRunning = false;
                // show final time briefly
                
                this.emitter.fireEvent(GameEventType.STOP_SOUND, { key: this.levelMusicKey });
                
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
                this.player.scaleX = 1;
                this.player.scaleY =1;

                this.player.alpha = 1;
                this.player.rotation = 0;
                ctrl.health = ctrl.maxHealth;
                ctrl.transformations.energy = ctrl.transformations.maxEnergy;
                ctrl.transformations.deactivate();
                this.player.setGroup(MBPhysicsGroups.PLAYER);
                ctrl.velocity = Vec2.ZERO;
                ctrl.changeState(PlayerStates.IDLE);

                break;
            }
            case MBEvents.TRANSFORM_START: {
                const form = event.data.get("form");
                
                this.updateTransformRing(form); 
                break;
            }
            case MBEvents.TRANSFORM_END: {
                this.player.setGroup(MBPhysicsGroups.PLAYER);
                this.playerWeaponSystem = this.originalWeaponSystem;
                this.UI_transformationSprite.animation.play(DittoForms.DITTO, true);
                break;
            }
            case MBEvents.ENERGY_CHANGE: {
                this.handleEnergyChange(event.data.get("cur"), event.data.get("max"));
                break;
            }
            case MBEvents.PLAYER_ENTERED_CHECKPOINT: {
                const nodeId = event.data.get("other");
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

            case MBEvents.PLAYER_HIT_ENTITY: {
            
                const otherID = event.data.get("other");

                const entity = this.entityMap.get(otherID);
                if (entity) {
                    entity.onPlayerContact();
                    break;
                }

                const pokemon = this.pokemonMap.get(otherID);
                if (pokemon && !pokemon.isFainted) {
                    const ctrl = this.player._ai as PlayerController;
                    ctrl.health -= pokemon.contactDamage;

                    // Knock player away from the pokemon
                    const knockDir = this.player.position.clone().sub(pokemon.position).normalize();
                    ctrl.velocity = new Vec2(knockDir.x * 200, -150);
                }
                break;
            }
            case MBEvents.PLAYER_HEAL: {
                const ctrl = this.player._ai as PlayerController;
                ctrl.health = Math.min(ctrl.health + event.data.get("amount"), ctrl.maxHealth);
                break;
            }
            case MBEvents.PLAYER_ENERGY_RESTORE: {
                const ctrl = this.player._ai as PlayerController;
                ctrl.transformations.energy = Math.min(ctrl.transformations.energy + event.data.get("amount"), ctrl.transformations.maxEnergy);
                break;
            }
            case MBEvents.PLAYER_BOUNCE : {
                const ctrl = this.player._ai as PlayerController;
                ctrl.velocity = new Vec2(0,-350);
                this.emitter.fireEvent(GameEventType.PLAY_SOUND, {key : this.jumpAudioKey});
                break;
            }
            case MBEvents.POKEMON_HIT: {
                const id: number = event.data.get("other") ?? event.data.get("node");
                
                const controller = this.pokemonMap.get(id);
                
                if (controller && !controller.isFainted) {
                    controller.onHit(1);
                }
                
                break;
            }
            case MBEvents.FORM_SELECTED: {
                this.updateUI();
                break;
            }
            case MBEvents.SHOW_CONTROLS: {

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
    protected updateTransformRing(formName: string): void {
        switch (formName) {
            
            case "CHARIZARD":
                this.UI_transformationSprite.animation.play(DittoForms.CHARIZARD, true);
                break;
            case "GRENINJA":
                this.UI_transformationSprite.animation.play(DittoForms.GRENINJA, true);
                break;
            default:
                this.UI_transformationSprite.animation.play(DittoForms.DITTO, true);
                break;
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
            this.timerRunning = false;
            this.emitter.fireEvent(GameEventType.STOP_SOUND, {key: this.levelMusicKey});
            
            this.emitter.fireEvent(GameEventType.PLAY_SOUND, { key: this.levelEndAudioKey });
            this.timerLabel.textColor = Color.YELLOW;
            
            
            this.levelEndTimer.start();
            this.levelEndLabel.tweens.play("slideIn");
        }
    }

    

    

    /* Initialization methods for everything in the scene */

    /**
     * Initialzes the layers
     */
    protected initLayers(): void {
        
        this.addUILayer(MBLayers.UI);
        this.addUILayer(MBLayers.PAUSE_BG);
        this.addUILayer(MBLayers.PAUSE);
        
        
        
        this.addLayer(MBLayers.PRIMARY);
         
        
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

    
    
    protected initializeHints(tilemapKey: string): void {
        const tilemapData = this.resourceManager.getTilemap(tilemapKey);
        if (!tilemapData) return;

        for (const layer of tilemapData.layers) {
            if (layer.type !== "objectgroup") continue;
            for (const obj of layer.objects) {
                const animKey = this.getHintAnimKey(obj.name);
                if (!animKey) continue;

                const sprite = this.add.animatedSprite(this.hintSpriteKey, MBLayers.PRIMARY);
                sprite.position.set(obj.x + obj.width / 2, obj.y + obj.height / 2);
                sprite.animation.play(animKey, false);
                sprite.visible = false;   // hidden by default
                this.hintSprites.push(sprite);
            }
        }
    }

    private getHintAnimKey(objName: string): string | null {
        switch (objName) {
            case "Transform": return "Transform";
            case "Ekey":      return "E";
            case "Fkey":      return "F";
            case "jump":      return "jump";
            default:          return null;
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
        this.receiver.subscribe(MBEvents.PLAYER_HIT_ENTITY);
        this.receiver.subscribe(MBEvents.PLAYER_HEAL);
        this.receiver.subscribe(MBEvents.PLAYER_BOUNCE);
        this.receiver.subscribe(MBEvents.PLAYER_ENERGY_RESTORE)
        this.receiver.subscribe(MBEvents.POKEMON_HIT);
        this.receiver.subscribe(MBEvents.FORM_SELECTED);
        this.receiver.subscribe(MBEvents.SHOW_CONTROLS);


    }

    protected initializeUI(): void {
        const screen = this.viewport.getHalfSize().scaled(2);

        this.UI_escapeSprite = this.add.animatedSprite(MBLevel.ESCAPE_OVERLAY_KEY, MBLayers.UI);
        this.UI_escapeSprite.position.set(44, 180);
        this.UI_escapeSprite.animation.play("IDLE", true);
        this.UI_escapeSprite.alpha = 0;  // hidden by default
        this.UI_escapeSprite.tweens.add("fadeIn", {
            startDelay: 0,
            duration: 600,
            effects: [{ property: TweenableProperties.alpha, start: 0, end: 1, ease: EaseFunctionType.IN_OUT_QUAD }]
        });
        this.UI_escapeSprite.tweens.add("fadeOut", {
            startDelay: 0,
            duration: 300,
            effects: [{ property: TweenableProperties.alpha, start: 1, end: 0, ease: EaseFunctionType.IN_OUT_QUAD }]
        });

        const timerX = screen.x - 20;
        this.timerLabel = <Label>this.add.uiElement(UIElementType.LABEL, MBLayers.UI, {
            position: new Vec2(timerX, 10),
            text: "0:00.00"
        });
        this.timerLabel.textColor = Color.WHITE;
        this.timerLabel.fontSize = 24;
        this.timerLabel.font = "Courier";
    
        // Transform ring UI (keep as-is, top-left corner)
        this.UI_transformationSprite = this.add.animatedSprite(this.transformUIkey, MBLayers.UI);
        this.UI_transformationSprite.position.set(16, 16);
        this.UI_transformationSprite.animation.play(DittoForms.DITTO, false);
        this.UI_transformationSprite.visible = true;
    
        // --- ENERGY ---
        this.energyLabel = <Label>this.add.uiElement(UIElementType.LABEL, MBLayers.UI, {
            position: new Vec2(50, 8),
            text: "ENERGY:"
        });
        this.energyLabel.textColor = Color.WHITE;
        this.energyLabel.fontSize = 12;
        this.energyLabel.font = "Courier";
    
        this.energyBar = <Label>this.add.uiElement(UIElementType.LABEL, MBLayers.UI, {
            position: new Vec2(90, 8),
            text: ""
        });
        this.energyBar.size = new Vec2(120, 20);
        this.energyBar.backgroundColor = Color.BLUE;
    
        this.energyBarBg = <Label>this.add.uiElement(UIElementType.LABEL, MBLayers.UI, {
            position: new Vec2(90, 8),
            text: ""
        });
        this.energyBarBg.size = new Vec2(120, 20);
        this.energyBarBg.borderColor = Color.WHITE;
    
        // --- HEALTH ---
        this.healthLabel = <Label>this.add.uiElement(UIElementType.LABEL, MBLayers.UI, {
            position: new Vec2(50, 22),
            text: "HEALTH:"
        });
        this.healthLabel.textColor = Color.WHITE;
        this.healthLabel.fontSize = 12;
        this.healthLabel.font = "Courier";
    
        this.healthBar = <Label>this.add.uiElement(UIElementType.LABEL, MBLayers.UI, {
            position: new Vec2(90, 22),
            text: ""
        });
        this.healthBar.size = new Vec2(120, 20);
        this.healthBar.backgroundColor = Color.GREEN;
    
        this.healthBarBg = <Label>this.add.uiElement(UIElementType.LABEL, MBLayers.UI, {
            position: new Vec2(90, 22),
            text: ""
        });
        this.healthBarBg.size = new Vec2(120, 20);
        this.healthBarBg.borderColor = Color.BLACK;
    
        // --- LEVEL END ---
        this.levelEndLabel = <Label>this.add.uiElement(UIElementType.LABEL, MBLayers.UI, {
            position: new Vec2(screen.x / 2, -100),
            text: "Level Complete"
        });
        this.levelEndLabel.size.set(300, 40);
        this.levelEndLabel.fontSize = 24;
        this.levelEndLabel.font = "PixelSimple";
        this.levelEndLabel.textColor = Color.WHITE;
        this.levelEndLabel.backgroundColor = new Color(34, 32, 52);
    
        // --- TRANSITION SCREEN ---
        this.levelTransitionScreen = <Rect>this.add.graphic(GraphicType.RECT, MBLayers.UI, {
            position: new Vec2(screen.x / 2, screen.y / 2),
            size: new Vec2(screen.x, screen.y)
        });
        this.levelTransitionScreen.color = new Color(34, 32, 52);
        this.levelTransitionScreen.alpha = 1;
        this.levelTransitionScreen.tweens.add("fadeIn", {
            startDelay: 0,
            duration: 1000,
            effects: [{ property: TweenableProperties.alpha, start: 0, end: 1, ease: EaseFunctionType.IN_OUT_QUAD }],
            onEnd: MBEvents.LEVEL_END
        });
        this.levelTransitionScreen.tweens.add("fadeOut", {
            startDelay: 0,
            duration: 1000,
            effects: [{ property: TweenableProperties.alpha, start: 1, end: 0, ease: EaseFunctionType.IN_OUT_QUAD }],
            onEnd: MBEvents.LEVEL_START
        });

        

        
    }
    protected handleHealthChange(currentHealth: number, maxHealth: number): void {
        const unit = this.healthBarBg.size.x / maxHealth;
        this.healthBar.size.set(
            this.healthBarBg.size.x - unit * (maxHealth - currentHealth),
            this.healthBarBg.size.y
        );
        this.healthBar.position.set(
            this.healthBarBg.position.x - (unit / 2 / this.getViewScale()) * (maxHealth - currentHealth),
            this.healthBarBg.position.y
        );
        this.healthBar.backgroundColor =
            currentHealth < maxHealth * 0.25 ? Color.RED :
            currentHealth < maxHealth * 0.75 ? Color.YELLOW :
            Color.GREEN;
    }
    
    protected handleEnergyChange(currentEnergy: number, maxEnergy: number): void {
        const unit = this.energyBarBg.size.x / maxEnergy;
        this.energyBar.size.set(
            this.energyBarBg.size.x - unit * (maxEnergy - currentEnergy),
            this.energyBarBg.size.y
        );
        this.energyBar.position.set(
            this.energyBarBg.position.x - (unit / 2 / this.getViewScale()) * (maxEnergy - currentEnergy),
            this.energyBarBg.position.y
        );
        this.energyBar.backgroundColor = currentEnergy < maxEnergy * 0.25 ? Color.RED : Color.BLUE;
    }
    
    

    protected initializeWeaponSystem(): void {
        this.playerWeaponSystem = new PlayerWeapon(100, Vec2.ZERO, 1000, 3, 0, 50);
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

        this.player.addPhysics(new AABB(this.player.position.clone(), new Vec2(8, 16)));
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
                    property: "scaleX",
                    start: 1,
                    end: 0,
                    ease: EaseFunctionType.IN_OUT_QUAD
                },
                {
                    property: "scaleY",
                    start: 1,
                    end: 0,
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
        this.viewport.setSize(320, 240);
        this.viewport.setBounds(16, 64, 16* 100, 16 * 74);
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
        this.levelEndArea.color = new Color(255, 0, 255, .50);
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

    

    protected spawnEntity(
        EntityClass: new (sprite: MBAnimatedSprite) => Entity,
        spriteKey: string,
        position: Vec2,
        collidable: boolean = false  // true = solid, false = trigger only
    ): Entity {
        const sprite = this.add.animatedSprite(spriteKey, MBLayers.PRIMARY);
        sprite.position.copy(position);
        sprite.animation.play("IDLE", true);
        sprite.addPhysics(new AABB(sprite.position.clone(), new Vec2(8, 8)), undefined, collidable, !collidable);
        sprite.setGroup(MBPhysicsGroups.ENTITY);
        sprite.setTrigger(MBPhysicsGroups.PLAYER, MBEvents.PLAYER_HIT_ENTITY, "");

        const entity = new EntityClass(sprite);
        
        this.entityMap.set(sprite.id, entity);
        this.entities.push(entity);

        return entity;
    }

    
}