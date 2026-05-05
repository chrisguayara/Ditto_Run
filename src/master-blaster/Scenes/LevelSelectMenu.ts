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
import WinterLevel from "./WinterLevel";
import CastleLevel from "./CastleLevel";
import ForestLevel from "./ForestLevel";
import GameState from "./GameState";
import MountainLevel from "./MountainLevel";

const Layers = {
    BACKGROUND: "BACKGROUND",
    PANEL:      "PANEL",
    MAIN:       "MAIN",
} as const;

const COL_PANEL_BG   = new Color( 22,  20,  40, 0.92);
const COL_BTN_BG     = new Color( 38,  36,  60, 1.0 );
const COL_BTN_BORDER = new Color(140, 138, 180, 1.0 );
const COL_BTN_TEXT   = new Color(230, 228, 255, 1.0 );
const COL_BTN_LOCKED = new Color(100,  98, 120, 1.0 );  // dimmed for locked levels
const COL_TITLE      = new Color(255, 230, 100, 1.0 );
const COL_BACK       = new Color(170, 168, 200, 1.0 );

const FONT          = "PixelSimple";
const BTN_FONT_SIZE = 16;
const BTN_PAD_X     = 60;
const BTN_PAD_Y     = 8;
const BTN_SPACING   = 42;

const CX = 600;
const CY = 400;

const ALL_LEVELS: Array<{ label: string; unlockKey: string; scene: new (...args: any[]) => Scene }> = [
    { label: "WINTER",     unlockKey: "WINTER",     scene: WinterLevel  },
    { label: "STRONGHOLD", unlockKey: "STRONGHOLD", scene: CastleLevel  },
    { label: "MOUNTAIN", unlockKey: "MOUNTAIN", scene: MountainLevel},
    { label: "FOREST",     unlockKey: "FOREST",     scene: ForestLevel  },
    
];

export default class LevelSelectMenu extends Scene {

    public loadScene(): void {
        // All assets kept alive from TitleCard → MainMenu chain
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

        const rowCount = ALL_LEVELS.length + 1;
        const panelH   = rowCount * BTN_SPACING + 52;
        const panelW   = 240;
        const panel = <Rect>this.add.graphic(GraphicType.RECT, Layers.PANEL, {
            position: new Vec2(CX, CY + 8),
            size:     new Vec2(panelW, panelH),
        });
        panel.color = COL_PANEL_BG;

        const titleLabel = <Label>this.add.uiElement(UIElementType.LABEL, Layers.MAIN, {
            position: new Vec2(CX, CY - panelH / 2 + 6),
            text: "SELECT LEVEL",
        });
        titleLabel.textColor       = COL_TITLE;
        titleLabel.font            = FONT;
        titleLabel.fontSize        = 16;
        titleLabel.backgroundColor = new Color(0, 0, 0, 0);

        const state     = GameState.getInstance();
        const totalRows = ALL_LEVELS.length + 1;
        const startY    = CY - ((totalRows - 1) * BTN_SPACING) / 2 + 12;

        ALL_LEVELS.forEach(({ label, unlockKey, scene }, i) => {
            const unlocked = state.isLevelUnlocked(unlockKey);
            const displayLabel = unlocked ? label : `${label}      ⛌`;
            const textColor    = unlocked ? COL_BTN_TEXT : COL_BTN_LOCKED;

            this.makeButton(displayLabel, CX, startY + i * BTN_SPACING, textColor, () => {
                if (!unlocked) return; // locked — do nothing
                this.select();
                // Stop menu music before entering level
                this.emitter.fireEvent(GameEventType.STOP_SOUND, { key: MenuAssets.MUSIC_KEY });
                setTimeout(() => {
                    this.sceneManager.changeToScene(scene);
                }, 0);
            });
        });

        const backY = startY + ALL_LEVELS.length * BTN_SPACING;
        this.makeButton("← BACK", CX, backY, COL_BACK, () => {
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

    private select(): void {
        this.emitter.fireEvent(GameEventType.PLAY_SOUND, { key: MenuAssets.SELECT_AUDIO_KEY });
    }

    private makeButton(text: string, x: number, y: number, textCol: Color, onClick: () => void): Button {
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