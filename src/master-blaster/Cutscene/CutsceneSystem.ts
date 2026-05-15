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
    iceSprite: AnimatedSprite;
    pickupSprite?: AnimatedSprite;
    onPickup?: () => void;
    onFree?: () => void;
    pressesPerLayer?: number;
    totalLayers?: number;
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

    private iceSprite!:      AnimatedSprite;
    private pressCount:      number = 0;
    private pressesPerLayer: number = IceBreakConfig.PRESSES_PER_LAYER;
    private totalLayers:     number = IceBreakConfig.TOTAL_LAYERS;
    private layersBroken:    number = 0;

    // ICE_BREAK1..ICE_BREAK4 played consecutively as each layer breaks
    private readonly ICE_BREAK_ANIMS = ["ICE_BREAK1", "ICE_BREAK2", "ICE_BREAK3", "ICE_BREAK4"];

    private onPlayAudio?: (key: string) => void;

    private pickupSprite?: AnimatedSprite;
    private onPickup?:     () => void;
    private onFree?:       () => void;

    private wasLeftPressed:  boolean = false;
    private wasRightPressed: boolean = false;
    private wasConfirmPressed: boolean = false;
    private wasAttackPressed:  boolean = false;
    private wasJumpPressed:    boolean = false;

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

    // ─────────────────────────────────────────────────────────────
    // The viewport is 320×240 in game units, scaled up to 1200×800
    // on screen. UI layer coordinates are in those 320×240 units.
    // The box is centred horizontally with a LEFT_PAD offset and
    // pinned near the bottom with BOTTOM_PAD.
    // ─────────────────────────────────────────────────────────────

    private buildTextbox(): void {
        const cfg    = TextboxConfig;
        const vp     = this.scene.getViewport().getHalfSize().scaled(2); // 320 × 240
        const cx     = vp.x / 2 + cfg.LEFT_PAD;                         // centre + right shift
        const cy     = vp.y - cfg.HEIGHT / 2 - cfg.BOTTOM_PAD;          // near bottom

        this.textboxBg = <Rect>this.scene.add.graphic(GraphicType.RECT, this.uiLayerName, {
            position: new Vec2(cx, cy),
            size:     new Vec2(cfg.WIDTH, cfg.HEIGHT),
        });
        this.textboxBg.color   = new Color(cfg.BG_COLOR[0], cfg.BG_COLOR[1], cfg.BG_COLOR[2], cfg.BG_ALPHA);
        this.textboxBg.visible = false;

        // Label left-edge = box left-edge + small internal pad
        this.textboxLabel = <Label>this.scene.add.uiElement(UIElementType.LABEL, this.uiLayerName, {
            position: new Vec2(cx - cfg.WIDTH / 2 + 8, cy),
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

        // Reset edge-detect booleans so a key held before start() doesn't
        // count as a fresh press on the very first frame.
        this.wasConfirmPressed = true;
        this.wasAttackPressed  = true;
        this.wasJumpPressed    = true;
        this.wasLeftPressed    = true;
        this.wasRightPressed   = true;

        this.iceSprite.visible = true;
        this.iceSprite.animation.play("IDLE", true);

        if (this.pickupSprite) this.pickupSprite.visible = false;

        this.textboxBg.visible    = true;
        this.textboxLabel.visible = true;
        this.textboxLabel.text    = "";

        this.repositionTextbox();
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

    // ── FROZEN: typewriter + manual edge-detect for advance ───────
    // We can't use Input.isJustPressed because Input may still be
    // "disabled" at the engine level during the fade-in. Instead we
    // track the previous frame's state ourselves using isPressed.

    private updateFrozen(_deltaT: number): void {
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
            if (this.displayedChars >= fullLine.length) this.lineComplete = true;
        } else {
            // Manually detect rising-edge on confirm / attack / jump
            const confirmNow = Input.isPressed(MBControls.CONFIRM);
            const attackNow  = Input.isPressed(MBControls.ATTACK);
            const jumpNow    = Input.isPressed(MBControls.JUMP);

            const justConfirm = confirmNow && !this.wasConfirmPressed;
            const justAttack  = attackNow  && !this.wasAttackPressed;
            const justJump    = jumpNow    && !this.wasJumpPressed;

            if (justConfirm || justAttack || justJump) {
                this.advanceLine();
            }

            this.wasConfirmPressed = confirmNow;
            this.wasAttackPressed  = attackNow;
            this.wasJumpPressed    = jumpNow;
        }
    }

    private advanceLine(): void {
        this.currentLine++;
        if (this.currentLine >= this.lines.length) {
            this.textboxLabel.text = "[ Press A or D to break free! ]";
            this.phase = CutscenePhase.ICE_BREAKING;

            // Reset edge-detect for ice-break phase
            this.wasLeftPressed  = true;
            this.wasRightPressed = true;
        } else {
            this.displayedChars = 0;
            this.charTimer      = 0;
            this.lineComplete   = false;
        }
    }

    // ── ICE_BREAKING: each A/D press advances one step ───────────
    // Every `pressesPerLayer` presses plays the next ICE_BREAK anim.
    // After `totalLayers` layers the cutscene ends.

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
        // layersBroken is the index of the layer we're about to break (0-based)
        if (this.layersBroken < this.ICE_BREAK_ANIMS.length) {
            const animName = this.ICE_BREAK_ANIMS[this.layersBroken];
            this.iceSprite.animation.play(animName, false);
            if (this.onPlayAudio) this.onPlayAudio("BlitzBreak");
        }

        this.layersBroken++;

        if (this.layersBroken >= this.totalLayers) {
            if (this.pickupSprite) {
                this.phase = CutscenePhase.PICKUP;
                this.textboxLabel.text = "";
                this.pickupSprite.visible = true;
            } else {
                this.enterFree();
            }
        }
    }

    // ── PICKUP ────────────────────────────────────────────────────

    private updatePickup(): void {
        this.textboxLabel.text = "The Steamheart... it's here.";
    }

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

    // ── Reposition every frame (screen-space, 320×240 units) ─────

   public repositionTextbox(): void {
        const cfg    = TextboxConfig;
        const screen = this.scene.getViewport().getHalfSize().scaled(2);

        const cx = screen.x / 2;
        const cy = screen.y - cfg.HEIGHT / 2 - cfg.BOTTOM_PAD - 8;

        this.textboxBg.position.set(cx, cy);
        this.textboxLabel.position.set(cx , cy);
    }

    public hide(): void {
        this.textboxBg.visible    = false;
        this.textboxLabel.visible = false;
    }
}