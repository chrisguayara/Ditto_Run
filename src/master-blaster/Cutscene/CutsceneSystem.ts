import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Input from "../../Wolfie2D/Input/Input";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import { GraphicType } from "../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Rect from "../../Wolfie2D/Nodes/Graphics/Rect";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import Color from "../../Wolfie2D/Utils/Color";
import Scene from "../../Wolfie2D/Scene/Scene";
import { MBControls } from "../MBControls";
import { TextboxConfig, IceBreakConfig } from "./CutsceneType";


export enum CutscenePhase {
    INACTIVE     = "INACTIVE",
    FROZEN       = "FROZEN",
    ICE_BREAKING = "ICE_BREAKING",
    PICKUP       = "PICKUP",
    FREE         = "FREE",
}

export interface CutsceneConfig {
    lines: string[];
    // The single cryo-greninja sprite that plays ICE_BREAK1..ICE_BREAK4
    iceSprite: AnimatedSprite;
    pickupSprite?: AnimatedSprite;
    onPickup?: () => void;
    onFree?: () => void;
    pressesPerLayer?: number;
    totalLayers?: number;
    // Instead of using emitter directly, pass a callback so CutsceneSystem
    // stays decoupled from the protected emitter on Scene.
    onPlayAudio?: (key: string) => void;
    scene: Scene;
    uiLayerName: string;
}

export default class CutsceneSystem {
    private phase: CutscenePhase = CutscenePhase.INACTIVE;

    private textboxBg!:    Rect;
    private textboxLabel!: Label;

    private lines:          string[] = [];
    private currentLine:    number   = 0;
    private displayedChars: number   = 0;
    private charTimer:      number   = 0;
    private lineComplete:   boolean  = false;

    // Single cryo-greninja sprite — we drive its animation per layer broken
    private iceSprite!:      AnimatedSprite;
    private pressCount:      number = 0;
    private pressesPerLayer: number = IceBreakConfig.PRESSES_PER_LAYER;
    private totalLayers:     number = IceBreakConfig.TOTAL_LAYERS;
    private layersBroken:    number = 0;

    // Animation names for each ice-break layer, e.g. ICE_BREAK1 … ICE_BREAK4
    private readonly ICE_BREAK_ANIMS = ["ICE_BREAK1", "ICE_BREAK2", "ICE_BREAK3", "ICE_BREAK4"];

    private onPlayAudio?: (key: string) => void;

    private pickupSprite?: AnimatedSprite;
    private onPickup?:     () => void;
    private onFree?:       () => void;

    private wasLeftPressed:  boolean = false;
    private wasRightPressed: boolean = false;

    private scene:       Scene;
    private uiLayerName: string;

    public get currentPhase(): CutscenePhase { return this.phase; }
    public get isActive(): boolean {
        return this.phase !== CutscenePhase.INACTIVE && this.phase !== CutscenePhase.FREE;
    }

    public constructor(config: CutsceneConfig) {
        this.scene           = config.scene;
        this.uiLayerName     = config.uiLayerName;
        this.lines           = config.lines;
        this.iceSprite       = config.iceSprite;
        this.pickupSprite    = config.pickupSprite;
        this.onPickup        = config.onPickup;
        this.onFree          = config.onFree;
        this.onPlayAudio     = config.onPlayAudio;
        this.pressesPerLayer = config.pressesPerLayer ?? IceBreakConfig.PRESSES_PER_LAYER;
        this.totalLayers     = config.totalLayers     ?? IceBreakConfig.TOTAL_LAYERS;

        this.buildTextbox();
    }

    private buildTextbox(): void {
        const cfg    = TextboxConfig;
        const screen = this.scene.getViewport().getHalfSize().scaled(2);
        const bx     = (screen.x - cfg.WIDTH)  / 2;
        const by     = screen.y - cfg.HEIGHT - cfg.BOTTOM_PAD;

        this.textboxBg = <Rect>this.scene.add.graphic(GraphicType.RECT, this.uiLayerName, {
            position: new Vec2(bx + cfg.WIDTH / 2, by + cfg.HEIGHT / 2),
            size:     new Vec2(cfg.WIDTH, cfg.HEIGHT),
        });
        this.textboxBg.color   = new Color(cfg.BG_COLOR[0], cfg.BG_COLOR[1], cfg.BG_COLOR[2], cfg.BG_ALPHA);
        this.textboxBg.visible = false;

        this.textboxLabel = <Label>this.scene.add.uiElement(UIElementType.LABEL, this.uiLayerName, {
            position: new Vec2(bx + 8, by + cfg.HEIGHT / 2),
            text: ""
        });
        this.textboxLabel.textColor       = Color.fromStringHex(cfg.TEXT_COLOR);
        this.textboxLabel.fontSize        = cfg.FONT_SIZE;
        this.textboxLabel.font            = cfg.FONT;
        this.textboxLabel.backgroundColor = new Color(0, 0, 0, 0);
        this.textboxLabel.visible         = false;
    }

    public start(): void {
        this.phase          = CutscenePhase.FROZEN;
        this.currentLine    = 0;
        this.displayedChars = 0;
        this.charTimer      = 0;
        this.lineComplete   = false;
        this.pressCount     = 0;
        this.layersBroken   = 0;

        // Show the cryo-greninja frozen in place
        this.iceSprite.visible = true;
        this.iceSprite.animation.play("IDLE", true);

        if (this.pickupSprite) this.pickupSprite.visible = false;

        this.textboxBg.visible    = true;
        this.textboxLabel.visible = true;
        this.textboxLabel.text    = "";
    }

    public update(deltaT: number): boolean {
        switch (this.phase) {
            case CutscenePhase.FROZEN:       this.updateFrozen(deltaT);      break;
            case CutscenePhase.ICE_BREAKING: this.updateIceBreaking(deltaT); break;
            case CutscenePhase.PICKUP:       this.updatePickup();             break;
            case CutscenePhase.FREE:         return false;
            case CutscenePhase.INACTIVE:     return false;
        }
        return true;
    }

    // ── FROZEN phase: typewriter dialogue ────────────────────────

    private updateFrozen(deltaT: number): void {
        const fullLine = this.lines[this.currentLine] ?? "";

        if (!this.lineComplete) {
            this.charTimer += 1;
            if (this.charTimer >= TextboxConfig.TICKS_PER_CHAR) {
                this.charTimer = 0;
                this.displayedChars = Math.min(
                    this.displayedChars + TextboxConfig.CHARS_PER_TICK,
                    fullLine.length
                );
            }
            this.textboxLabel.text = fullLine.substring(0, this.displayedChars);

            if (this.displayedChars >= fullLine.length) {
                this.lineComplete = true;
            }
        } else {
            if (Input.isJustPressed(MBControls.CONFIRM)
             || Input.isJustPressed(MBControls.ATTACK)
             || Input.isJustPressed(MBControls.JUMP)) {
                this.advanceLine();
            }
        }
    }

    private advanceLine(): void {
        this.currentLine++;
        if (this.currentLine >= this.lines.length) {
            // All dialogue done — move to mashing phase
            this.textboxLabel.text = "[ Press A or D to break free! ]";
            this.phase = CutscenePhase.ICE_BREAKING;
        } else {
            this.displayedChars = 0;
            this.charTimer      = 0;
            this.lineComplete   = false;
        }
    }

    // ── ICE_BREAKING phase: mash A/D to cycle ICE_BREAK1…ICE_BREAK4 ─

    private updateIceBreaking(_deltaT: number): void {
        const leftNow  = Input.isPressed(MBControls.MOVE_LEFT);
        const rightNow = Input.isPressed(MBControls.MOVE_RIGHT);

        const leftJust  = leftNow  && !this.wasLeftPressed;
        const rightJust = rightNow && !this.wasRightPressed;

        if (leftJust || rightJust) {
            this.pressCount++;
            this.updateIcePromptText();

            if (this.pressCount % this.pressesPerLayer === 0) {
                this.breakNextLayer();
            }
        }

        this.wasLeftPressed  = leftNow;
        this.wasRightPressed = rightNow;
    }

    private updateIcePromptText(): void {
        const remaining =
            (this.pressesPerLayer - (this.pressCount % this.pressesPerLayer)) %
            this.pressesPerLayer;

        this.textboxLabel.text =
            remaining === 0 && this.layersBroken < this.totalLayers
                ? "[ Keep going! ]"
                : "[ Press A or D to break free! ]";
    }

    private breakNextLayer(): void {
        if (this.layersBroken < this.totalLayers) {
            // Play ICE_BREAK1, ICE_BREAK2, ICE_BREAK3, ICE_BREAK4 in order
            const animName = this.ICE_BREAK_ANIMS[this.layersBroken]
                          ?? this.ICE_BREAK_ANIMS[this.ICE_BREAK_ANIMS.length - 1];
            this.iceSprite.animation.play(animName, false);

            // Fire audio via callback — no emitter access needed
            if (this.onPlayAudio) this.onPlayAudio("BlitzBreak");
        }

        this.layersBroken++;

        if (this.layersBroken >= this.totalLayers) {
            // All ice broken — move to pickup or directly to FREE
            if (this.pickupSprite) {
                this.phase = CutscenePhase.PICKUP;
                this.textboxLabel.text = "";
                this.pickupSprite.visible = true;
            } else {
                this.enterFree();
            }
        }
    }

    // ── PICKUP phase ─────────────────────────────────────────────

    private updatePickup(): void {
        this.textboxLabel.text = "The Steamheart... it's here.";
    }

    /** Call from Prologue when player walks over the steamheart entity. */
    public collectPickup(): void {
        if (this.phase !== CutscenePhase.PICKUP) return;
        if (this.pickupSprite) this.pickupSprite.visible = false;
        this.onPickup?.();
        this.enterFree();
    }

    private enterFree(): void {
        this.phase = CutscenePhase.FREE;
        this.textboxBg.visible    = false;
        this.textboxLabel.visible = false;
        this.iceSprite.visible    = false;
        this.onFree?.();
    }

    // ── Helpers ───────────────────────────────────────────────────

    /** Call every frame from the scene's updateScene so the textbox tracks the viewport. */
    public repositionTextbox(): void {
        const cfg    = TextboxConfig;
        const screen = this.scene.getViewport().getHalfSize().scaled(2);
        const bx     = (screen.x - cfg.WIDTH)  / 2;
        const by     = screen.y - cfg.HEIGHT - cfg.BOTTOM_PAD;
        this.textboxBg.position.set(bx + cfg.WIDTH / 2, by + cfg.HEIGHT / 2);
        this.textboxLabel.position.set(bx + 8, by + cfg.HEIGHT / 2);
    }

    public hide(): void {
        this.textboxBg.visible    = false;
        this.textboxLabel.visible = false;
    }
}