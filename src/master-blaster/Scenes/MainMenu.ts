import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import { GameEventType } from "../../Wolfie2D/Events/GameEventType";
import Button from "../../Wolfie2D/Nodes/UIElements/Button";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import { GraphicType } from "../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Rect from "../../Wolfie2D/Nodes/Graphics/Rect";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import Input from "../../Wolfie2D/Input/Input";
import { MBControls } from "../MBControls";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import LevelSelectMenu from "./LevelSelectMenu";
import ControlsMenu from "./ControlsMenu";
import CastleLevel from "./CastleLevel";

// ─── Layers ───────────────────────────────────────────────────────────────────

export const MenuLayers = {
    BACKGROUND: "BACKGROUND",
    PANEL:      "PANEL",
    MAIN:       "MAIN",
} as const;

// ─── Style constants ──────────────────────────────────────────────────────────

/** Dark navy — same tone used in level transitions */
const COL_PANEL_BG   = new Color( 22,  20,  40, 0.88);
const COL_BTN_BG     = new Color( 38,  36,  60, 1.0 );
const COL_BTN_BORDER = new Color(140, 138, 180, 1.0 );
const COL_BTN_TEXT   = new Color(230, 228, 255, 1.0 );
const COL_TITLE      = new Color(255, 230, 100, 1.0 );  // warm yellow

const FONT          = "monospace";
const BTN_FONT_SIZE = 16;
const BTN_PAD_X     = 60;  // horizontal padding inside button
const BTN_PAD_Y     = 8;   // vertical padding inside button
const BTN_SPACING   = 100  // gap between button centres

// Screen centre in UI-space (matches existing viewport/focus setup)
const CX = 600;
const CY = 400;
const CX_HIT = 600;   // world/canvas x where clicks actually register
const CY_HIT = 400;
// ─────────────────────────────────────────────────────────────────────────────

export default class MainMenu extends Scene {

    // ── Asset keys ────────────────────────────────────────────────
    public static readonly START_SCREEN_KEY  = "StartScreen";
    public static readonly START_SCREEN_PATH = "game_assets/spritesheets/STARTSCREEN.json";

    public static readonly MUSIC_KEY  = "MAIN_MENU_MUSIC";
    public static readonly MUSIC_PATH = "game_assets/music/jeanparker_insideout105master.wav";

    public static readonly SELECT_AUDIO_KEY  = "SELECT_AUDIO_KEY";
    public static readonly SELECT_AUDIO_PATH = "game_assets/sounds/pickup.mp3";

    // ── State ─────────────────────────────────────────────────────
    private canStart: boolean = false;

    // ─────────────────────────────────────────────────────────────────────────

    public loadScene(): void {
        this.load.audio(MainMenu.MUSIC_KEY, MainMenu.MUSIC_PATH);
        this.load.spritesheet(MainMenu.START_SCREEN_KEY, MainMenu.START_SCREEN_PATH);
        this.load.audio(MainMenu.SELECT_AUDIO_KEY, MainMenu.SELECT_AUDIO_PATH);
    }

    public startScene(): void {
        // ── Layers ────────────────────────────────────────────────
        this.addLayer(MenuLayers.BACKGROUND);
        this.addUILayer(MenuLayers.PANEL);
        this.addUILayer(MenuLayers.MAIN);

        // ── Viewport ──────────────────────────────────────────────
        this.viewport.setSize(1200, 800);
        this.viewport.setBounds(0, 0, 1200, 800);
        this.viewport.setFocus(new Vec2(CX, CY));

        // ── Animated backdrop ─────────────────────────────────────
        const bg = this.add.animatedSprite(MainMenu.START_SCREEN_KEY, MenuLayers.BACKGROUND);
        bg.position.set(CX, CY);
        bg.animation.playIfNotAlready("DEFAULT", true);

        // ── Semi-transparent panel behind buttons ─────────────────
        const BUTTONS = [
            "START",
            "LEVELS",
            // "HELP",    commented out until implemented
            "CONTROLS",
            "FEEDBACK",
        ];
        const panelH = 800;
        const panelW = 1200;
        const panel = <Rect>this.add.graphic(GraphicType.RECT, MenuLayers.PANEL, {
            position: new Vec2(CX_HIT, CY_HIT + 8),
            size:     new Vec2(panelW, panelH),
        });
        panel.color = COL_PANEL_BG;

        // ── Title label ───────────────────────────────────────────
        const titleLabel = <Label>this.add.uiElement(UIElementType.LABEL, MenuLayers.MAIN, {
            position: new Vec2(CX, CY - panelH / 2 + 4),
            text: "MENU",
        });
        titleLabel.textColor   = COL_TITLE;
        titleLabel.font        = FONT;
        titleLabel.fontSize    = 14;
        titleLabel.backgroundColor = new Color(0, 0, 0, 0);

        // ── Buttons ───────────────────────────────────────────────
        const startY = CY - ((BUTTONS.length - 1) * BTN_SPACING) / 2;

        BUTTONS.forEach((label, i) => {
            const y = (CY_HIT - ((BUTTONS.length - 1) * BTN_SPACING) / 2 + 8) + i * BTN_SPACING;
            this.makeButton(label, CX_HIT, y, () => this.onButtonClick(label));
        });

        // ── Audio ─────────────────────────────────────────────────
        this.emitter.fireEvent(GameEventType.PLAY_SOUND, {
            key: MainMenu.MUSIC_KEY,
            loop: true,
            holdReference: false,
        });

        // Brief guard so an Escape-key from a previous scene doesn't fire immediately
        setTimeout(() => { this.canStart = true; }, 300);
    }

    public updateScene(_deltaT: number): void {
        if (!this.canStart) return;

        if (Input.isJustPressed(MBControls.CONFIRM)) {
            this.select();
            this.navigateTo(LevelSelectMenu);  // Enter goes straight to level select
        }
    }

    public unloadScene(): void {
        this.load.keepAudio(MainMenu.SELECT_AUDIO_KEY);
        this.emitter.fireEvent(GameEventType.STOP_SOUND, { key: MainMenu.MUSIC_KEY });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    private onButtonClick(label: string): void {
        this.select();
        switch (label) {
            case "START":
                this.navigateTo(LevelSelectMenu);
                break;
            case "LEVELS":
                this.navigateTo(LevelSelectMenu);
                break;
            // case "HELP":
            //     break;
            case "CONTROLS":
                this.navigateTo(ControlsMenu);
                break;
            case "FEEDBACK":
                // Replace this URL with the actual Google Form link
                window.open("https://forms.gle/REPLACE_WITH_REAL_URL", "_blank");
                break;
        }
    }

    /** Play the select sound */
    private select(): void {
        this.emitter.fireEvent(GameEventType.PLAY_SOUND, { key: MainMenu.SELECT_AUDIO_KEY });
    }

    /** Change to a scene, keeping the select sound resource alive */
    private navigateTo(SceneClass: new (...args: any[]) => Scene): void {
        this.sceneManager.changeToScene(SceneClass);
    }

    /**
     * Creates a styled dark-panel button.
     * Follows the same pattern as the existing transparent button but with
     * a visible background and border so it reads clearly over the backdrop.
     */
    private makeButton(text: string, x: number, y: number, onClick: () => void): Button {
        const btn = <Button>this.add.uiElement(UIElementType.BUTTON, MenuLayers.MAIN, {
            position: new Vec2(x, y),
            text,
        });
        btn.backgroundColor = COL_BTN_BG;
        btn.borderColor     = COL_BTN_BORDER;
        btn.borderRadius    = 0;
        btn.setPadding(new Vec2(BTN_PAD_X, BTN_PAD_Y));
        (btn as any).textColor = COL_BTN_TEXT;
        btn.font     = FONT;
        btn.fontSize = BTN_FONT_SIZE;
        btn.onClick  = onClick;
        return btn;
    }
}