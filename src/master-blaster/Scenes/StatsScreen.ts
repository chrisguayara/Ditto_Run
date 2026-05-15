// src/master-blaster/Scenes/StatsScreen.ts

import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import { GameEventType } from "../../Wolfie2D/Events/GameEventType";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import { GraphicType } from "../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Rect from "../../Wolfie2D/Nodes/Graphics/Rect";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import Button from "../../Wolfie2D/Nodes/UIElements/Button";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import Input from "../../Wolfie2D/Input/Input";
import { MBControls } from "../MBControls";
import MainMenu from "./MainMenu";
import { MenuAssets } from "./MenuAssets";
import ScoreManager, { LevelKey, LevelScore } from "./ScoreManager";

const Layers = { BACKGROUND: "BACKGROUND", PANEL: "PANEL", MAIN: "MAIN" } as const;

const COL_PANEL_BG   = new Color( 22,  20,  40, 0.92);
const COL_TITLE      = new Color(255, 230, 100, 1.0);
const COL_TAB_ACTIVE = new Color(255, 255, 255, 1.0);
const COL_TAB_IDLE   = new Color(120, 118, 160, 1.0);
const COL_VALUE      = new Color(100, 220, 255, 1.0);
const COL_GOLD       = new Color(255, 215,   0, 1.0);
const COL_GRAY       = new Color(180, 180, 180, 1.0);
const COL_BACK       = new Color(170, 168, 200, 1.0);
const COL_NONE       = new Color(80,   78, 110, 1.0);
const FONT           = "monospace";

const CX = 600;
const CY = 400;

const TAB_LABELS: Record<string, string> = {
    WINTER:     "WINTER",
    CASTLE:     "STRONGHOLD",
    MOUNTAIN:   "MOUNTAIN",
    SKY_TEMPLE: "SKY TEMPLE",
    TOTAL:      "TOTAL",
};

export default class StatsScreen extends Scene {

    private tabs:       string[] = [ "TOTAL", "WINTER", "CASTLE", "MOUNTAIN", "SKY_TEMPLE"];
    private activeTab:  number   = 0;

    // Dynamic labels we update when switching tabs
    private statLabels: Label[]  = [];
    private tabBtns:    Label[]  = [];

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

        // Background
        const bg = this.add.animatedSprite(MenuAssets.START_SCREEN_KEY, Layers.BACKGROUND);
        bg.position.set(CX, CY);
        bg.animation.playIfNotAlready("DEFAULT", true);

        // Panel
        const panel = <Rect>this.add.graphic(GraphicType.RECT, Layers.PANEL, {
            position: new Vec2(CX, CY + 8),
            size:     new Vec2(1200, 800),
        });
        panel.color = COL_PANEL_BG;

        // Title
        const title = <Label>this.add.uiElement(UIElementType.LABEL, Layers.MAIN, {
            position: new Vec2(CX, CY - 200),
            text: "STATISTICS",
        });
        title.textColor       = COL_TITLE;
        title.font            = FONT;
        title.fontSize        = 24;
        title.backgroundColor = new Color(0, 0, 0, 0);

        // Tabs row
        const tabY    = CY - 158;
        const tabW    = 640 / this.tabs.length;
        this.tabBtns  = [];

        this.tabs.forEach((tab, i) => {
            const lbl = <Label>this.add.uiElement(UIElementType.LABEL, Layers.MAIN, {
                position: new Vec2(CX - 300 + tabW * i + tabW / 2, tabY),
                text: TAB_LABELS[tab],
            });
            lbl.font            = FONT;
            lbl.fontSize        = 16;
            lbl.backgroundColor = new Color(0, 0, 0, 0);
            lbl.textColor       = i === this.activeTab ? COL_TAB_ACTIVE : COL_TAB_IDLE;
            this.tabBtns.push(lbl);
        });

        // Stat rows — built dynamically
        for (let i = 0; i < 6; i++) {
            const lbl = <Label>this.add.uiElement(UIElementType.LABEL, Layers.MAIN, {
                position: new Vec2(CX, CY - 80 + i * 44),
                text: "",
            });
            lbl.font            = FONT;
            lbl.fontSize        = 26;
            lbl.backgroundColor = new Color(0, 0, 0, 0);
            lbl.textColor       = COL_GRAY;
            this.statLabels.push(lbl);
        }

        // Back button
        const back = <Button>this.add.uiElement(UIElementType.BUTTON, Layers.MAIN, {
            position: new Vec2(CX, CY + 190),
            text: "← BACK",
        });
        back.backgroundColor = new Color(38, 36, 60, 1);
        back.borderColor     = new Color(140, 138, 180, 1);
        back.borderRadius    = 0;
        back.setPadding(new Vec2(60, 8));
        back.textColor       = COL_BACK;
        back.font            = FONT;
        back.fontSize        = 20;
        back.onClick         = () => this.goBack();

        this.refreshStats();
    }

    public updateScene(_deltaT: number): void {
        // Tab navigation with left/right arrows
        if (Input.isJustPressed(MBControls.ATTACK_LEFT)) {
            this.activeTab = (this.activeTab - 1 + this.tabs.length) % this.tabs.length;
            this.refreshStats();
        }
        if (Input.isJustPressed(MBControls.ATTACK_RIGHT)) {
            this.activeTab = (this.activeTab + 1) % this.tabs.length;
            this.refreshStats();
        }
        if (Input.isJustPressed(MBControls.PAUSE)
         || Input.isJustPressed(MBControls.CONFIRM)) {
            this.goBack();
        }
    }

    public unloadScene(): void {
        this.load.keepAudio(MenuAssets.MUSIC_KEY);
        this.load.keepAudio(MenuAssets.SELECT_AUDIO_KEY);
    }

    // ── Helpers ───────────────────────────────────────────────────

    private refreshStats(): void {
        // Update tab colors
        this.tabBtns.forEach((btn, i) => {
            btn.textColor = i === this.activeTab ? COL_TAB_ACTIVE : COL_TAB_IDLE;
        });

        const sm  = ScoreManager.getInstance();
        const tab = this.tabs[this.activeTab];

        // Clear all stat labels
        this.statLabels.forEach(l => {
            l.text      = "";
            l.textColor = COL_GRAY;
             l.fontSize  = 26;
        });

        if (tab === "TOTAL") {
            this.showTotal(sm);
        } else {
            this.showLevel(sm, tab as LevelKey);
        }
    }

    private showLevel(sm: ScoreManager, level: LevelKey): void {
        const scores = sm.getTopScores(level);

        if (scores.length === 0) {
            this.statLabels[0].text      = "NO SCORE YET";
            this.statLabels[0].textColor = COL_NONE;
            return;
        }

        const pad = (v: number) => v < 10 ? "0" + v : "" + v;
        const fmtTime = (t: number) => {
            const mins = Math.floor(t / 60);
            const secs = Math.floor(t % 60);
            const ms   = Math.floor((t % 1) * 100);
            return `${mins}:${pad(secs)}.${pad(ms)}`;
        };

        const medals = ["★", "②", "③"];

        scores.forEach((s, i) => {
            const color = i === 0 ? COL_GOLD : i === 1
                ? new Color(180, 180, 200)
                : new Color(140, 100, 60);
            const fontSize = i === 0 ? 32 : i === 1 ? 26 : 20;  // gold > silver > bronze

            this.statLabels[i].text = 
                `${medals[i]}  ${s.score.toString().padStart(4)}  ${fmtTime(s.time)}  ♥${s.health}  ✦${s.candy}`;
            this.statLabels[i].textColor = color;
            this.statLabels[i].fontSize  = fontSize;
        });

        // Fill remaining slots with dashes
        for (let i = scores.length; i < 3; i++) {
            this.statLabels[i].text      = `${medals[i]}  ---`;
            this.statLabels[i].textColor = COL_NONE;
        }
    }

    private showTotal(sm: ScoreManager): void {
        this.statLabels[0].text      = `CUMULATIVE SCORE`;
        this.statLabels[0].textColor = COL_TITLE;

        this.statLabels[1].text      = `${sm.getCumulativeTotal()}`;
        this.statLabels[1].textColor = COL_GOLD;
        this.statLabels[1].fontSize  = 16;

        // Per-level breakdown
        const keys: LevelKey[] = ["WINTER", "CASTLE", "MOUNTAIN", "SKY_TEMPLE"];
        keys.forEach((key, i) => {
            const best = sm.getBestScore(key);
            this.statLabels[i + 2].text      =
                `${TAB_LABELS[key].padEnd(12)} ${best ? best.score : "---"}`;
            this.statLabels[i + 2].textColor = best ? COL_VALUE : COL_NONE;
        });
    }

    private goBack(): void {
        this.emitter.fireEvent(GameEventType.PLAY_SOUND, { key: MenuAssets.SELECT_AUDIO_KEY });
        this.sceneManager.changeToScene(MainMenu);
    }
}