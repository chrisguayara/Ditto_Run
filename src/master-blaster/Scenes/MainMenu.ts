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
import LevelSelectMenu from "./LevelSelectMenu";
import ControlsMenu from "./ControlsMenu";
import CheatsMenu from "./CheatsMenu";
import { MenuAssets } from "./MenuAssets";
import WinterLevel from "./WinterLevel";

export const MenuLayers = {
    BACKGROUND: "BACKGROUND",
    PANEL:      "PANEL",
    MAIN:       "MAIN",
} as const;

const COL_PANEL_BG   = new Color( 22,  20,  40, 0.88);
const COL_BTN_BG     = new Color( 38,  36,  60, 1.0 );
const COL_BTN_BORDER = new Color(140, 138, 180, 1.0 );
const COL_BTN_TEXT   = new Color(230, 228, 255, 1.0 );
const COL_TITLE      = new Color(255, 230, 100, 1.0 );

const FONT          = "monospace";
const BTN_FONT_SIZE = 16;
const BTN_PAD_X     = 60;
const BTN_PAD_Y     = 8;
const BTN_SPACING   = 100;
const CX = 600;
const CY = 400;

export default class MainMenu extends Scene {

    public static readonly MUSIC_KEY         = MenuAssets.MUSIC_KEY;
    public static readonly SELECT_AUDIO_KEY  = MenuAssets.SELECT_AUDIO_KEY;
    public static readonly START_SCREEN_KEY  = MenuAssets.START_SCREEN_KEY;
    public static readonly START_SCREEN_PATH = MenuAssets.START_SCREEN_PATH;

    private canStart: boolean = false;

    public loadScene(): void {
        // Always load these — if they were kept alive the engine skips re-fetching,
        // if they weren't (e.g. returning from a level) this reloads them properly.
        this.load.audio(MenuAssets.MUSIC_KEY, MenuAssets.MUSIC_PATH);
        this.load.spritesheet(MenuAssets.START_SCREEN_KEY, MenuAssets.START_SCREEN_PATH);
        this.load.audio(MenuAssets.SELECT_AUDIO_KEY, MenuAssets.SELECT_AUDIO_PATH);
    }

    public startScene(): void {
        this.addLayer(MenuLayers.BACKGROUND);
        this.addUILayer(MenuLayers.PANEL);
        this.addUILayer(MenuLayers.MAIN);

        this.viewport.setSize(1200, 800);
        this.viewport.setBounds(0, 0, 1200, 800);
        this.viewport.setFocus(new Vec2(CX, CY));

        // Background sprite
        const bg = this.add.animatedSprite(MenuAssets.START_SCREEN_KEY, MenuLayers.BACKGROUND);
        bg.position.set(CX, CY);
        bg.animation.playIfNotAlready("DEFAULT", true);

        // Dark overlay panel
        const panelH = 800;
        const panelW = 1200;
        const panel = <Rect>this.add.graphic(GraphicType.RECT, MenuLayers.PANEL, {
            position: new Vec2(CX, CY),
            size:     new Vec2(panelW, panelH),
        });
        panel.color = COL_PANEL_BG;

        // Title
        const titleLabel = <Label>this.add.uiElement(UIElementType.LABEL, MenuLayers.MAIN, {
            position: new Vec2(CX, 120),
            text: "SPLITSTEAM",
        });
        titleLabel.textColor       = COL_TITLE;
        titleLabel.font            = FONT;
        titleLabel.fontSize        = 28;
        titleLabel.backgroundColor = new Color(0, 0, 0, 0);

        // Buttons — START always goes to WinterLevel, LEVELS opens level select
        const BUTTONS = ["START", "LEVELS", "CONTROLS", "CHEATS"];
        BUTTONS.forEach((label, i) => {
            const y = (CY - ((BUTTONS.length - 1) * BTN_SPACING) / 2) + i * BTN_SPACING;
            this.makeButton(label, CX, y, () => this.onButtonClick(label));
        });

        // (Re)start music — safe to fire even if already playing in most engines;
        // if yours deduplicates by key this is harmless, otherwise stop first.
        this.emitter.fireEvent(GameEventType.STOP_SOUND,  { key: MenuAssets.MUSIC_KEY });
        this.emitter.fireEvent(GameEventType.PLAY_SOUND, {
            key: MenuAssets.MUSIC_KEY,
            loop: true,
            holdReference: true,
        });

        setTimeout(() => { this.canStart = true; }, 300);
    }

    public updateScene(_deltaT: number): void {
        if (!this.canStart) return;
        if (Input.isJustPressed(MBControls.CONFIRM)) {
            this.select();
            this.launchLevel();
        }
    }

    public unloadScene(): void {
        this.load.keepAudio(MenuAssets.MUSIC_KEY);
        this.load.keepAudio(MenuAssets.SELECT_AUDIO_KEY);
        this.load.keepSpritesheet(MenuAssets.START_SCREEN_KEY);
    }

    private onButtonClick(label: string): void {
        this.select();
        switch (label) {
            case "START":    this.launchLevel();              break;
            case "LEVELS":   this.navigateTo(LevelSelectMenu); break;
            case "CONTROLS": this.navigateTo(ControlsMenu);   break;
            case "CHEATS":   this.navigateTo(CheatsMenu);     break;
        }
    }

    // START always goes to WinterLevel (first level)
    private launchLevel(): void {
        this.emitter.fireEvent(GameEventType.STOP_SOUND, { key: MenuAssets.MUSIC_KEY });
        this.sceneManager.changeToScene(WinterLevel);
    }

    private select(): void {
        this.emitter.fireEvent(GameEventType.PLAY_SOUND, { key: MenuAssets.SELECT_AUDIO_KEY });
    }

    private navigateTo(SceneClass: new (...args: any[]) => Scene): void {
        this.sceneManager.changeToScene(SceneClass);
    }

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