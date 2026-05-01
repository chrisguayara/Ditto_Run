import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import { GameEventType } from "../../Wolfie2D/Events/GameEventType";
import { GraphicType } from "../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Rect from "../../Wolfie2D/Nodes/Graphics/Rect";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import Input from "../../Wolfie2D/Input/Input";
import { MBControls } from "../MBControls";
import MainMenu from "./MainMenu";

const CX = 600;
const CY = 400;
const FONT = "PixelSimple";

const COL_BG      = new Color( 22,  20,  40, 1.0);
const COL_PANEL   = new Color( 34,  32,  60, 0.95);
const COL_TITLE   = new Color(255, 230, 100, 1.0);
const COL_HEADER  = new Color(255, 230, 100, 1.0);
const COL_ACTION  = new Color(230, 228, 255, 1.0);
const COL_KEY     = new Color(100, 220, 255, 1.0);
const COL_SEP     = new Color(120, 118, 150, 1.0);
const COL_BACK    = new Color(255, 230, 100, 1.0);

const LAYERS = {
    BG:   "CM_BG",
    MAIN: "CM_MAIN",
} as const;

type Row =
    | { kind: "title" | "sep" | "back"; text: string }
    | { kind: "header"; text: string }
    | { kind: "row"; action: string; key: string };

const LAYOUT: Row[] = [
    { kind: "title",  text: "~ CONTROLS ~" },
    { kind: "sep",    text: "────────────────────" },
    { kind: "header", text: "MOVEMENT" },
    { kind: "row",    action: "Move",        key: "A / D"  },
    { kind: "row",    action: "Jump",         key: "W"      },
    { kind: "header", text: "COMBAT" },
    { kind: "row",    action: "Attack",       key: "Mouse"  },
    { kind: "header", text: "TRANSFORM" },
    { kind: "row",    action: "Transform",    key: "E"      },
    { kind: "header", text: "MENU" },
    { kind: "row",    action: "Pause",        key: "Esc"    },
    { kind: "back",   text: "> BACK <" },
];

const TITLE_H = 18, SEP_H = 10, HEADER_H = 16, ROW_H = 14;
const GAP_TITLE = 8, GAP_SEP = 6, GAP_GROUP = 8, BACK_MARGIN = 14;

export default class ControlsMenu extends Scene {

    private canNavigate: boolean = false;

    public loadScene(): void {}

    public startScene(): void {
        this.addUILayer(LAYERS.BG);
        this.addUILayer(LAYERS.MAIN);

        this.viewport.setSize(320, 240);
        this.viewport.setBounds(0, 0, 1200, 800);
        this.viewport.setFocus(new Vec2(CX, CY));

        // Solid dark background rect
        const fullBg = <Rect>this.add.graphic(GraphicType.RECT, LAYERS.BG, {
            position: new Vec2(CX, CY),
            size: new Vec2(1200, 800),
        });
        fullBg.color = COL_BG;

        // Measure total block height for centering
        let totalH = 0;
        for (let i = 0; i < LAYOUT.length; i++) {
            const item = LAYOUT[i];
            if      (item.kind === "title")  totalH += TITLE_H + GAP_TITLE;
            else if (item.kind === "sep")    totalH += SEP_H + GAP_SEP;
            else if (item.kind === "header") {
                if (i > 0 && LAYOUT[i - 1].kind === "row") totalH += GAP_GROUP;
                totalH += HEADER_H;
            }
            else if (item.kind === "row")   totalH += ROW_H;
            else if (item.kind === "back")  totalH += BACK_MARGIN + ROW_H;
        }

        // Panel behind text
        const panelPad = 24;
        const panel = <Rect>this.add.graphic(GraphicType.RECT, LAYERS.BG, {
            position: new Vec2(CX, CY),
            size: new Vec2(220, totalH + panelPad * 2),
        });
        panel.color = COL_PANEL;

        // Build labels
        let y = CY - totalH / 2;

        const lbl = (text: string, xOff: number, yPos: number, color: Color, size: number) => {
            const l = <Label>this.add.uiElement(UIElementType.LABEL, LAYERS.MAIN, {
                position: new Vec2(CX + xOff, yPos),
                text,
            });
            l.textColor = color;
            l.fontSize  = size;
            l.font      = FONT;
            l.backgroundColor = new Color(0, 0, 0, 0);
        };

        for (let i = 0; i < LAYOUT.length; i++) {
            const item = LAYOUT[i];
            if (item.kind === "title") {
                lbl(item.text, 0, y, COL_TITLE, 14);
                y += TITLE_H + GAP_TITLE;
            } else if (item.kind === "sep") {
                lbl(item.text, 0, y, COL_SEP, 7);
                y += SEP_H + GAP_SEP;
            } else if (item.kind === "header") {
                if (i > 0 && LAYOUT[i - 1].kind === "row") y += GAP_GROUP;
                lbl("· " + item.text, -10, y, COL_HEADER, 10);
                y += HEADER_H;
            } else if (item.kind === "row") {
                lbl(item.action, -36, y, COL_ACTION, 9);
                lbl(item.key,     42, y, COL_KEY,    9);
                y += ROW_H;
            } else if (item.kind === "back") {
                y += BACK_MARGIN;
                lbl(item.text, 0, y, COL_BACK, 11);
            }
        }

        setTimeout(() => { this.canNavigate = true; }, 300);
    }

    public updateScene(_deltaT: number): void {
        if (!this.canNavigate) return;
        if (Input.isJustPressed(MBControls.PAUSE)
         || Input.isJustPressed(MBControls.CONFIRM)
         || Input.isJustPressed(MBControls.ATTACK)) {
            this.sceneManager.changeToScene(MainMenu);
        }
    }

    public unloadScene(): void {}
}