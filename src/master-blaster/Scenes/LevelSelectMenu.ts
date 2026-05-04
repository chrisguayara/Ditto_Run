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
import MainMenu from "./MainMenu";
import WinterLevel from "./WinterLevel";
import CastleLevel from "./CastleLevel";
import ForestLevel from "./ForestLevel";

// ─── Layers ───────────────────────────────────────────────────────────────────

const Layers = {
    BACKGROUND: "BACKGROUND",
    PANEL:      "PANEL",
    MAIN:       "MAIN",
} as const;

// ─── Style (mirrors MainMenu) ─────────────────────────────────────────────────

const COL_PANEL_BG   = new Color( 22,  20,  40, 0.92);
const COL_BTN_BG     = new Color( 38,  36,  60, 1.0 );
const COL_BTN_BORDER = new Color(140, 138, 180, 1.0 );
const COL_BTN_TEXT   = new Color(230, 228, 255, 1.0 );
const COL_TITLE      = new Color(255, 230, 100, 1.0 );
const COL_BACK       = new Color(170, 168, 200, 1.0 );  // dimmer for back button

const FONT          = "PixelSimple";
const BTN_FONT_SIZE = 16;
const BTN_PAD_X     = 60;
const BTN_PAD_Y     = 8;
const BTN_SPACING   = 42;

const CX = 600;
const CY = 400;

// ─── Level entries ────────────────────────────────────────────────────────────
// Add new entries here as new levels are built.

const LEVELS: Array<{ label: string; scene: new (...args: any[]) => Scene }> = [
    { label: "WINTER",  scene: WinterLevel  },
    { label: "STRONGHOLD",  scene: CastleLevel  },
    {label: "FOREST", scene: ForestLevel }
    // { label: "FOREST",  scene: ForestLevel  },  Format
];

// ─────────────────────────────────────────────────────────────────────────────

export default class LevelSelectMenu extends Scene {

    public loadScene(): void {
        // this.load.audio(MainMenu.MUSIC_KEY, MainMenu.MUSIC_PATH);
        this.load.spritesheet(MainMenu.START_SCREEN_KEY, MainMenu.START_SCREEN_PATH);
        this.load.audio(MainMenu.SELECT_AUDIO_KEY, MainMenu.SELECT_AUDIO_PATH);
    }

    public startScene(): void {
        // ── Layers ────────────────────────────────────────────────
        this.addLayer(Layers.BACKGROUND);
        this.addUILayer(Layers.PANEL);
        this.addUILayer(Layers.MAIN);

        // ── Viewport ──────────────────────────────────────────────
        this.viewport.setSize(1200, 800);
        this.viewport.setBounds(0, 0, 1200, 800);
        this.viewport.setFocus(new Vec2(CX, CY));

        // ── Backdrop (same animated sprite) ───────────────────────
        const bg = this.add.animatedSprite(MainMenu.START_SCREEN_KEY, Layers.BACKGROUND);
        bg.position.set(CX, CY);
        bg.animation.playIfNotAlready("DEFAULT", true);

        // ── Panel ─────────────────────────────────────────────────
        // Levels + back button + some padding
        const rowCount = LEVELS.length + 1;   // +1 for BACK
        const panelH   = rowCount * BTN_SPACING + 52;
        const panelW   = 220;
        const panel = <Rect>this.add.graphic(GraphicType.RECT, Layers.PANEL, {
            position: new Vec2(CX, CY + 8),
            size:     new Vec2(panelW, panelH),
        });
        panel.color = COL_PANEL_BG;

        // ── Title ─────────────────────────────────────────────────
        const titleLabel = <Label>this.add.uiElement(UIElementType.LABEL, Layers.MAIN, {
            position: new Vec2(CX, CY - panelH / 2 + 6),
            text: "SELECT LEVEL",
        });
        titleLabel.textColor        = COL_TITLE;
        titleLabel.font             = FONT;
        titleLabel.fontSize         = 16;
        titleLabel.backgroundColor  = new Color(0, 0, 0, 0);

        // ── Level buttons ─────────────────────────────────────────
        const totalRows = LEVELS.length + 1;   // levels + back
        const startY    = CY - ((totalRows - 1) * BTN_SPACING) / 2 + 12;

        LEVELS.forEach(({ label, scene }, i) => {
            this.makeButton(label, CX, startY + i * BTN_SPACING, COL_BTN_TEXT, () => {
                this.select();

                // Stop FIRST
                this.emitter.fireEvent(GameEventType.STOP_SOUND, { key: MainMenu.MUSIC_KEY });

                // Then delay scene switch by 1 tick
                setTimeout(() => {
                    this.sceneManager.changeToScene(scene);
                }, 0);
            });
        });

        // ── Back button ───────────────────────────────────────────
        const backY = startY + LEVELS.length * BTN_SPACING;
        this.makeButton("← BACK", CX, backY, COL_BACK, () => {
            this.select();
            this.sceneManager.changeToScene(MainMenu);
        });

        // ── Audio ─────────────────────────────────────────────────
        
    }

    public updateScene(_deltaT: number): void {
        // Escape / pause key goes back
        if (Input.isJustPressed(MBControls.PAUSE)) {
            this.select();
            this.sceneManager.changeToScene(MainMenu);
        }
    }

    public unloadScene(): void {
        this.load.keepAudio(MainMenu.SELECT_AUDIO_KEY);
        
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private select(): void {
        this.emitter.fireEvent(GameEventType.PLAY_SOUND, { key: MainMenu.SELECT_AUDIO_KEY });
    }

    private makeButton(
        text:    string,
        x:       number,
        y:       number,
        textCol: Color,
        onClick: () => void,
    ): Button {
        const btn = <Button>this.add.uiElement(UIElementType.BUTTON, Layers.MAIN, {
            position: new Vec2(x, y),
            text,
        });
        btn.backgroundColor = COL_BTN_BG;
        btn.borderColor     = COL_BTN_BORDER;
        btn.borderRadius    = 0;
        btn.setPadding(new Vec2(BTN_PAD_X, BTN_PAD_Y));
        (btn as any).textColor = textCol;
        btn.font     = FONT;
        btn.fontSize = BTN_FONT_SIZE;
        btn.onClick  = onClick;
        return btn;
    }
}