// src/mb_game/Scenes/CheatsMenu.ts

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
import { MenuAssets } from "./MenuAssets";
import GameState from "./GameState";

const Layers = {
    BACKGROUND: "BACKGROUND",
    PANEL:      "PANEL",
    MAIN:       "MAIN",
} as const;

const COL_PANEL_BG   = new Color( 22,  20,  40, 0.92);
const COL_BTN_BG     = new Color( 38,  36,  60, 1.0 );
const COL_BTN_BORDER = new Color(140, 138, 180, 1.0 );
const COL_TITLE      = new Color(255, 230, 100, 1.0 );
const COL_BACK       = new Color(170, 168, 200, 1.0 );
const COL_ON         = new Color(100, 255, 140, 1.0 );  // green  = cheat active
const COL_OFF        = new Color(230, 228, 255, 1.0 );  // normal = cheat off

const FONT          = "PixelSimple";
const BTN_FONT_SIZE = 16;
const BTN_PAD_X     = 60;
const BTN_PAD_Y     = 8;
const BTN_SPACING   = 52;

const CX = 600;
const CY = 400;

export default class CheatsMenu extends Scene {

    // We keep references to the toggle labels so we can re-color them
    private unlockAllLabel!: Button;
    private infHealthLabel!: Button;

    public loadScene(): void {
        // Assets already alive from menu chain
    }

    public startScene(): void {
        this.addLayer(Layers.BACKGROUND);
        this.addUILayer(Layers.PANEL);
        this.addUILayer(Layers.MAIN);

        this.viewport.setSize(1200, 800);
        this.viewport.setBounds(0, 0, 1200, 800);
        this.viewport.setFocus(new Vec2(CX, CY));

        const bg = this.add.animatedSprite(MenuAssets.START_SCREEN_KEY, Layers.BACKGROUND);
        bg.position.set(CX, CY);
        bg.animation.playIfNotAlready("DEFAULT", true);

        const rowCount = 3; // unlock all + inf health + back
        const panelH   = rowCount * BTN_SPACING + 80;
        const panelW   = 320;
        const panel = <Rect>this.add.graphic(GraphicType.RECT, Layers.PANEL, {
            position: new Vec2(CX, CY + 8),
            size:     new Vec2(panelW, panelH),
        });
        panel.color = COL_PANEL_BG;

        // Title
        const titleLabel = <Label>this.add.uiElement(UIElementType.LABEL, Layers.MAIN, {
            position: new Vec2(CX, CY - panelH / 2 + 14),
            text: "CHEATS",
        });
        titleLabel.textColor       = COL_TITLE;
        titleLabel.font            = FONT;
        titleLabel.fontSize        = 18;
        titleLabel.backgroundColor = new Color(0, 0, 0, 0);

        const state  = GameState.getInstance();
        const startY = CY - BTN_SPACING + 8;

        // ── Toggle: Unlock All Levels ─────────────────────────────
        this.unlockAllLabel = this.makeToggleButton(
            this.getUnlockLabel(state.cheatsUnlockAll),
            CX, startY,
            state.cheatsUnlockAll ? COL_ON : COL_OFF,
            () => {
                state.cheatsUnlockAll = !state.cheatsUnlockAll;
                this.refreshToggle(this.unlockAllLabel,
                    this.getUnlockLabel(state.cheatsUnlockAll),
                    state.cheatsUnlockAll);
                this.select();
            }
        );

        // ── Toggle: Infinite Health ───────────────────────────────
        this.infHealthLabel = this.makeToggleButton(
            this.getHealthLabel(state.cheatsInfiniteHealth),
            CX, startY + BTN_SPACING,
            state.cheatsInfiniteHealth ? COL_ON : COL_OFF,
            () => {
                state.cheatsInfiniteHealth = !state.cheatsInfiniteHealth;
                this.refreshToggle(this.infHealthLabel,
                    this.getHealthLabel(state.cheatsInfiniteHealth),
                    state.cheatsInfiniteHealth);
                this.select();
            }
        );

        // ── Back ──────────────────────────────────────────────────
        this.makeToggleButton("← BACK", CX, startY + BTN_SPACING * 2, COL_BACK, () => {
            this.select();
            this.sceneManager.changeToScene(MainMenu);
        });
    }

    public updateScene(_deltaT: number): void {
        if (Input.isJustPressed(MBControls.PAUSE)) {
            this.select();
            this.sceneManager.changeToScene(MainMenu);
        }
    }

    public unloadScene(): void {
        this.load.keepAudio(MenuAssets.MUSIC_KEY);
        this.load.keepAudio(MenuAssets.SELECT_AUDIO_KEY);
    }

    // ── Helpers ───────────────────────────────────────────────────

    private getUnlockLabel(on: boolean): string {
        return `UNLOCK ALL:  ${on ? "ON" : "OFF"}`;
    }

    private getHealthLabel(on: boolean): string {
        return `INF HEALTH:  ${on ? "ON" : "OFF"}`;
    }

    private refreshToggle(btn: Button, text: string, isOn: boolean): void {
        btn.text = text;
        (btn as any).textColor = isOn ? COL_ON : COL_OFF;
    }

    private select(): void {
        this.emitter.fireEvent(GameEventType.PLAY_SOUND, { key: MenuAssets.SELECT_AUDIO_KEY });
    }

    private makeToggleButton(text: string, x: number, y: number, textCol: Color, onClick: () => void): Button {
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