import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import { GameEventType } from "../../Wolfie2D/Events/GameEventType";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import { GraphicType } from "../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Rect from "../../Wolfie2D/Nodes/Graphics/Rect";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import Input from "../../Wolfie2D/Input/Input";
import { MBControls } from "../MBControls";
import { MenuAssets } from "./MenuAssets";
import GameState from "./GameState";
import LevelSelectMenu from "./LevelSelectMenu";
import MainMenu from "./MainMenu";
import Prologue from "./Prologue";

// ── Constants ─────────────────────────────────────────────────────────────────

const CHARS      = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CHAR_COUNT = 3;

const Layers = {
    BACKGROUND: "BACKGROUND",
    PANEL:      "PANEL",
    MAIN:       "MAIN",
} as const;

const CX = 600;
const CY = 400;

const COL_PANEL    = new Color( 22,  20,  40, 0.92);
const COL_TITLE    = new Color(255, 230, 100);
const COL_CHAR_SEL = new Color(255, 255, 100);   // active slot letter
const COL_CHAR     = new Color(230, 228, 255);   // inactive slot letter
const COL_BOX_SEL  = new Color( 80,  78, 130);   // active slot bg
const COL_BOX      = new Color( 38,  36,  60);   // inactive slot bg
const COL_BORDER   = new Color(140, 138, 180);
const COL_HINT     = new Color(120, 118, 150);
const FONT         = "PixelSimple";

const BOX_SIZE = 90;
const BOX_GAP  = 24;

// ─────────────────────────────────────────────────────────────────────────────

export default class NameEntryScreen extends Scene {

    private charValues:   number[] = [0, 0, 0];   // index into CHARS for each slot
    private selectedSlot: number   = 0;
    private charLabels:   Label[]  = [];
    private charBoxes:    Rect[]   = [];
    private arrowUp!:     Label;
    private arrowDown!:   Label;

    // ── Scene lifecycle ───────────────────────────────────────────

    public loadScene(): void {
        // All assets already alive from menu chain
    }

    public startScene(): void {
        this.addLayer(Layers.BACKGROUND);
        this.addUILayer(Layers.PANEL);
        this.addUILayer(Layers.MAIN);

        this.viewport.setSize(1200, 800);
        this.viewport.setBounds(0, 0, 1200, 800);
        this.viewport.setFocus(new Vec2(CX, CY));

        // Backdrop
        const bg = this.add.animatedSprite(MenuAssets.START_SCREEN_KEY, Layers.BACKGROUND);
        bg.position.set(CX, CY);
        bg.animation.playIfNotAlready("DEFAULT", true);

        // Panel
        const panel = <Rect>this.add.graphic(GraphicType.RECT, Layers.PANEL, {
            position: new Vec2(CX, CY),
            size:     new Vec2(560, 380),
        });
        panel.color = COL_PANEL;

        // Title
        this.makeLabel("ENTER YOUR NAME", CX, CY - 155, 28, COL_TITLE);

        // Subtitle
        this.makeLabel(
            "Your initials will appear on the global leaderboard",
            CX, CY - 112, 14, COL_HINT
        );

        // ── Character slots ───────────────────────────────────────
        const totalW = CHAR_COUNT * BOX_SIZE + (CHAR_COUNT - 1) * BOX_GAP;
        const startX = CX - totalW / 2 + BOX_SIZE / 2;

        for (let i = 0; i < CHAR_COUNT; i++) {
            const x = startX + i * (BOX_SIZE + BOX_GAP);

            // Box
            const box = <Rect>this.add.graphic(GraphicType.RECT, Layers.PANEL, {
                position: new Vec2(x, CY - 20),
                size:     new Vec2(BOX_SIZE, BOX_SIZE),
            });
            box.color = i === 0 ? COL_BOX_SEL : COL_BOX;
            this.charBoxes.push(box);

            // Letter
            const lbl = <Label>this.add.uiElement(UIElementType.LABEL, Layers.MAIN, {
                position: new Vec2(x, CY - 20),
                text: "A",
            });
            lbl.textColor       = i === 0 ? COL_CHAR_SEL : COL_CHAR;
            lbl.font            = FONT;
            lbl.fontSize        = 52;
            lbl.backgroundColor = new Color(0, 0, 0, 0);
            this.charLabels.push(lbl);
        }

        // Arrows on active slot (cosmetic cues)
        const ax = startX; // starts over slot 0
        this.arrowUp   = this.makeLabel("▲", ax, CY - 78, 18, COL_CHAR_SEL);
        this.arrowDown = this.makeLabel("▼", ax, CY + 42, 18, COL_CHAR_SEL);

        // ── Instructions ──────────────────────────────────────────
        const hints: [string, number][] = [
            ["W / S  or  ▲ ▼   change letter",          CY + 88 ],
            ["A / D  or  ◄ ►   move between slots",     CY + 110],
            ["ENTER  to confirm",                        CY + 132],
        ];
        for (const [text, y] of hints) {
            this.makeLabel(text, CX, y, 15, COL_HINT);
        }

        this.emitter.fireEvent(GameEventType.PLAY_SOUND, {
            key: MenuAssets.MUSIC_KEY,
            loop: true,
            holdReference: true,
        });
    }

    public updateScene(_deltaT: number): void {
        let changed = false;

        // ── Cycle current letter ──────────────────────────────────
        if (Input.isJustPressed(MBControls.JUMP) || Input.isJustPressed(MBControls.ATTACK_UP)) {
            this.charValues[this.selectedSlot] =
                (this.charValues[this.selectedSlot] - 1 + CHARS.length) % CHARS.length;
            changed = true;
        }
        if (Input.isJustPressed(MBControls.DOWN) || Input.isJustPressed(MBControls.ATTACK_DOWN)) {
            this.charValues[this.selectedSlot] =
                (this.charValues[this.selectedSlot] + 1) % CHARS.length;
            changed = true;
        }

        // ── Move between slots ────────────────────────────────────
        if (Input.isJustPressed(MBControls.MOVE_LEFT) || Input.isJustPressed(MBControls.ATTACK_LEFT)) {
            if (this.selectedSlot > 0) { this.selectedSlot--; changed = true; }
        }
        if (Input.isJustPressed(MBControls.MOVE_RIGHT) || Input.isJustPressed(MBControls.ATTACK_RIGHT)) {
            if (this.selectedSlot < CHAR_COUNT - 1) { this.selectedSlot++; changed = true; }
        }

        if (changed) {
            this.refreshDisplay();
            // this.emitter.fireEvent(GameEventType.PLAY_SOUND, { key: MenuAssets.SELECT_AUDIO_KEY });
        }

        // ── Confirm ───────────────────────────────────────────────
        if (Input.isJustPressed(MBControls.CONFIRM)) {
            const name = this.charValues.map(i => CHARS[i]).join("");
            GameState.getInstance().playerName = name;
            this.emitter.fireEvent(GameEventType.PLAY_SOUND, { key: MenuAssets.SELECT_AUDIO_KEY });
            this.sceneManager.changeToScene(Prologue);
        }

        // ── Back — skip name entry (will be asked again next session) ──
        if (Input.isJustPressed(MBControls.PAUSE)) {
            this.sceneManager.changeToScene(MainMenu);
        }
    }

    public unloadScene(): void {
        this.load.keepAudio(MenuAssets.MUSIC_KEY);
        this.load.keepAudio(MenuAssets.SELECT_AUDIO_KEY);
    }

    // ── Helpers ───────────────────────────────────────────────────

    private refreshDisplay(): void {
        // Compute starting X again (same formula as startScene)
        const totalW = CHAR_COUNT * BOX_SIZE + (CHAR_COUNT - 1) * BOX_GAP;
        const startX = CX - totalW / 2 + BOX_SIZE / 2;

        for (let i = 0; i < CHAR_COUNT; i++) {
            const active = i === this.selectedSlot;
            this.charLabels[i].text      = CHARS[this.charValues[i]];
            this.charLabels[i].textColor = active ? COL_CHAR_SEL : COL_CHAR;
            this.charBoxes[i].color      = active ? COL_BOX_SEL : COL_BOX;
        }

        // Move arrows over the active slot
        const ax = startX + this.selectedSlot * (BOX_SIZE + BOX_GAP);
        this.arrowUp.position.set(ax,        CY - 78);
        this.arrowDown.position.set(ax,      CY + 42);
    }

    private makeLabel(text: string, x: number, y: number, size: number, color: Color): Label {
        const lbl = <Label>this.add.uiElement(UIElementType.LABEL, Layers.MAIN, {
            position: new Vec2(x, y),
            text,
        });
        lbl.textColor       = color;
        lbl.font            = FONT;
        lbl.fontSize        = size;
        lbl.backgroundColor = new Color(0, 0, 0, 0);
        return lbl;
    }
}
