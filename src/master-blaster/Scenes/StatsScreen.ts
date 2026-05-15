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
import ScoreManager, { LevelKey } from "./ScoreManager";
import { FIRESTORE_BASE } from "./FirebaseConfig";

// ── Layers / style ────────────────────────────────────────────────────────────

const Layers = { BACKGROUND: "BACKGROUND", PANEL: "PANEL", MAIN: "MAIN" } as const;

const COL_PANEL_BG   = new Color( 22,  20,  40, 0.92);
const COL_TITLE      = new Color(255, 230, 100, 1.0);
const COL_TAB_ACTIVE = new Color(255, 255, 255, 1.0);
const COL_TAB_IDLE   = new Color(120, 118, 160, 1.0);
const COL_VALUE      = new Color(100, 220, 255, 1.0);
const COL_GOLD       = new Color(255, 215,   0, 1.0);
const COL_GRAY       = new Color(180, 180, 180, 1.0);
const COL_BACK       = new Color(170, 168, 200, 1.0);
const COL_NONE       = new Color( 80,  78, 110, 1.0);
const COL_LOADING    = new Color(120, 118, 160, 1.0);
const COL_ERROR      = new Color(255,  80,  80, 1.0);
const COL_LB_GOLD    = new Color(255, 215,   0, 1.0);
const COL_LB_SILVER  = new Color(180, 180, 200, 1.0);
const COL_LB_BRONZE  = new Color(180, 120,  60, 1.0);
const COL_LB_NORMAL  = new Color(200, 198, 230, 1.0);
const FONT           = "monospace";

const CX = 600;
const CY = 400;

const TAB_LABELS: Record<string, string> = {
    WINTER:      "WINTER",
    CASTLE:      "STRONGHOLD",
    MOUNTAIN:    "MOUNTAIN",
    SKY_TEMPLE:  "SKY TEMPLE",
    TOTAL:       "TOTAL",
    LEADERBOARD: "GLOBAL",
};

// ── Leaderboard entry shape ───────────────────────────────────────────────────

interface LbEntry {
    name:  string;
    score: number;
}

// ─────────────────────────────────────────────────────────────────────────────

export default class StatsScreen extends Scene {

    private tabs:      string[] = ["TOTAL", "WINTER", "CASTLE", "MOUNTAIN", "SKY_TEMPLE", "LEADERBOARD"];
    private activeTab: number   = 0;

    // Local stat labels (6 rows)
    private statLabels: Label[] = [];
    // Leaderboard labels (10 rows + 1 status/header)
    private lbLabels:   Label[] = [];
    // Tab header buttons
    private tabBtns:    Label[] = [];

    // Leaderboard state
    private lbCache:   LbEntry[] | null = null;
    private lbLoading: boolean          = false;
    private lbError:   boolean          = false;

    // ── Scene lifecycle ───────────────────────────────────────────

    public loadScene(): void { /* all assets alive from menu chain */ }

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

        // ── Tab row ───────────────────────────────────────────────
        const tabY   = CY - 158;
        const tabW   = 720 / this.tabs.length;
        this.tabBtns = [];

        this.tabs.forEach((tab, i) => {
            const lbl = <Label>this.add.uiElement(UIElementType.LABEL, Layers.MAIN, {
                position: new Vec2(CX - 360 + tabW * i + tabW / 2, tabY),
                text: TAB_LABELS[tab],
            });
            lbl.font            = FONT;
            lbl.fontSize        = 14;
            lbl.backgroundColor = new Color(0, 0, 0, 0);
            lbl.textColor       = i === 0 ? COL_TAB_ACTIVE : COL_TAB_IDLE;
            this.tabBtns.push(lbl);
        });

        // ── Local stat labels (6 rows) ────────────────────────────
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

        // ── Leaderboard labels (1 header/status + 10 rows) ────────
        // Header / loading / error message
        const lbHeader = <Label>this.add.uiElement(UIElementType.LABEL, Layers.MAIN, {
            position: new Vec2(CX, CY - 118),
            text: "",
        });
        lbHeader.font            = FONT;
        lbHeader.fontSize        = 14;
        lbHeader.backgroundColor = new Color(0, 0, 0, 0);
        lbHeader.textColor       = COL_LOADING;
        lbHeader.visible         = false;
        this.lbLabels.push(lbHeader);   // index 0 = status/header row

        for (let i = 0; i < 10; i++) {
            const lbl = <Label>this.add.uiElement(UIElementType.LABEL, Layers.MAIN, {
                position: new Vec2(CX, CY - 80 + i * 36),
                text: "",
            });
            lbl.font            = FONT;
            lbl.fontSize        = 20;
            lbl.backgroundColor = new Color(0, 0, 0, 0);
            lbl.textColor       = COL_LB_NORMAL;
            lbl.visible         = false;
            this.lbLabels.push(lbl);    // indices 1-10 = entry rows
        }

        // ── Back button ───────────────────────────────────────────
        const back = <Button>this.add.uiElement(UIElementType.BUTTON, Layers.MAIN, {
            position: new Vec2(CX, CY + 200),
            text: "← BACK",
        });
        back.backgroundColor = new Color(38, 36, 60, 1);
        back.borderColor     = new Color(140, 138, 180, 1);
        back.borderRadius    = 0;
        back.setPadding(new Vec2(60, 8));
        (back as any).textColor = COL_BACK;
        back.font    = FONT;
        back.fontSize = 20;
        back.onClick  = () => this.goBack();

        this.refreshStats();
    }

    public updateScene(_deltaT: number): void {
        if (Input.isJustPressed(MBControls.ATTACK_LEFT)) {
            this.activeTab = (this.activeTab - 1 + this.tabs.length) % this.tabs.length;
            this.refreshStats();
        }
        if (Input.isJustPressed(MBControls.ATTACK_RIGHT)) {
            this.activeTab = (this.activeTab + 1) % this.tabs.length;
            this.refreshStats();
        }
        if (Input.isJustPressed(MBControls.PAUSE) || Input.isJustPressed(MBControls.CONFIRM)) {
            this.goBack();
        }
    }

    public unloadScene(): void {
        this.load.keepAudio(MenuAssets.MUSIC_KEY);
        this.load.keepAudio(MenuAssets.SELECT_AUDIO_KEY);
    }

    // ── Refresh logic ─────────────────────────────────────────────

    private refreshStats(): void {
        // Update tab colors
        this.tabBtns.forEach((btn, i) => {
            btn.textColor = i === this.activeTab ? COL_TAB_ACTIVE : COL_TAB_IDLE;
        });

        const tab = this.tabs[this.activeTab];
        const isLb = tab === "LEADERBOARD";

        // Toggle which set of labels is visible
        this.statLabels.forEach(l => l.visible = !isLb);
        this.lbLabels.forEach(  l => l.visible =  isLb);

        if (isLb) {
            this.showLeaderboard();
            return;
        }

        // Clear stat labels
        this.statLabels.forEach(l => {
            l.text      = "";
            l.textColor = COL_GRAY;
            l.fontSize  = 26;
        });

        const sm = ScoreManager.getInstance();
        if (tab === "TOTAL") {
            this.showTotal(sm);
        } else {
            this.showLevel(sm, tab as LevelKey);
        }
    }

    // ── Local stat display ────────────────────────────────────────

    private showLevel(sm: ScoreManager, level: LevelKey): void {
        const scores = sm.getTopScores(level);

        if (scores.length === 0) {
            this.statLabels[0].text      = "NO SCORE YET";
            this.statLabels[0].textColor = COL_NONE;
            return;
        }

        const pad     = (v: number) => v < 10 ? "0" + v : "" + v;
        const fmtTime = (t: number) => {
            const m  = Math.floor(t / 60);
            const s  = Math.floor(t % 60);
            const ms = Math.floor((t % 1) * 100);
            return `${m}:${pad(s)}.${pad(ms)}`;
        };
        const medals   = ["★", "②", "③"];
        const colors   = [COL_GOLD, new Color(180, 180, 200), new Color(140, 100, 60)];
        const sizes    = [32, 26, 20];

        scores.forEach((s, i) => {
            this.statLabels[i].text =
                `${medals[i]}  ${s.score.toString().padStart(4)}  ${fmtTime(s.time)}  ♥${s.health}  ✦${s.candy}`;
            this.statLabels[i].textColor = colors[i];
            this.statLabels[i].fontSize  = sizes[i];
        });

        for (let i = scores.length; i < 3; i++) {
            this.statLabels[i].text      = `${medals[i]}  ---`;
            this.statLabels[i].textColor = COL_NONE;
        }
    }

    private showTotal(sm: ScoreManager): void {
        this.statLabels[0].text      = "CUMULATIVE SCORE";
        this.statLabels[0].textColor = COL_TITLE;

        this.statLabels[1].text      = `${sm.getCumulativeTotal()}`;
        this.statLabels[1].textColor = COL_GOLD;
        this.statLabels[1].fontSize  = 16;

        const keys: LevelKey[] = ["WINTER", "CASTLE", "MOUNTAIN", "SKY_TEMPLE"];
        keys.forEach((key, i) => {
            const best = sm.getBestScore(key);
            this.statLabels[i + 2].text =
                `${TAB_LABELS[key].padEnd(12)} ${best ? best.score : "---"}`;
            this.statLabels[i + 2].textColor = best ? COL_VALUE : COL_NONE;
        });
    }

    // ── Leaderboard display ───────────────────────────────────────

    /**
     * Shows the leaderboard.  Uses cached data if available; otherwise kicks
     * off a fetch and shows a loading message while waiting.
     */
    private showLeaderboard(): void {
        if (this.lbCache !== null) {
            this.renderLeaderboard(this.lbCache);
            return;
        }

        if (this.lbLoading) {
            // Already fetching — just show the loading message
            this.lbLabels[0].text      = "Fetching scores…";
            this.lbLabels[0].textColor = COL_LOADING;
            for (let i = 1; i < this.lbLabels.length; i++) {
                this.lbLabels[i].text = "";
            }
            return;
        }

        // First visit — kick off fetch
        this.lbLoading = true;
        this.lbLabels[0].text      = "Fetching scores…";
        this.lbLabels[0].textColor = COL_LOADING;
        for (let i = 1; i < this.lbLabels.length; i++) {
            this.lbLabels[i].text = "";
        }

        this.fetchLeaderboard().then(entries => {
            this.lbCache   = entries;
            this.lbLoading = false;
            this.lbError   = false;

            // Only render if the leaderboard tab is still active
            if (this.tabs[this.activeTab] === "LEADERBOARD") {
                this.renderLeaderboard(entries);
            }
        }).catch(err => {
            console.warn("Leaderboard fetch failed:", err);
            this.lbLoading = false;
            this.lbError   = true;

            if (this.tabs[this.activeTab] === "LEADERBOARD") {
                this.lbLabels[0].text      = "Could not load scores — check connection";
                this.lbLabels[0].textColor = COL_ERROR;
            }
        });
    }

    private renderLeaderboard(entries: LbEntry[]): void {
        // Status / column header
        if (entries.length === 0) {
            this.lbLabels[0].text      = "No scores yet — be the first!";
            this.lbLabels[0].textColor = COL_LOADING;
            for (let i = 1; i < this.lbLabels.length; i++) this.lbLabels[i].text = "";
            return;
        }

        this.lbLabels[0].text      = "RANK    NAME    SCORE";
        this.lbLabels[0].textColor = COL_GRAY;
        this.lbLabels[0].fontSize  = 14;

        const medalColors = [COL_LB_GOLD, COL_LB_SILVER, COL_LB_BRONZE];
        const medals      = ["★", "②", "③"];

        entries.forEach((e, i) => {
            const lbl   = this.lbLabels[i + 1];
            const rank  = i < 3 ? medals[i] : `#${i + 1}`;
            const color = i < 3 ? medalColors[i] : COL_LB_NORMAL;
            const size  = i === 0 ? 26 : i < 3 ? 22 : 18;

            lbl.text      = `${rank.padEnd(4)}   ${e.name.padEnd(4)}   ${e.score}`;
            lbl.textColor = color;
            lbl.fontSize  = size;
        });

        // Blank out unused rows
        for (let i = entries.length + 1; i < this.lbLabels.length; i++) {
            this.lbLabels[i].text = "";
        }
    }

    /**
     * Queries the Firestore `Leaderboard` collection, returning the top 10
     * entries sorted by cumulative score descending.
     */
    private async fetchLeaderboard(): Promise<LbEntry[]> {
        const url = `${FIRESTORE_BASE}:runQuery`;

        const body = {
            structuredQuery: {
                from:    [{ collectionId: "Leaderboard" }],
                orderBy: [{ field: { fieldPath: "score" }, direction: "DESCENDING" }],
                limit:   8,
            },
        };

        const res  = await fetch(url, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(body),
        });

        if (!res.ok) throw new Error(`Firestore responded ${res.status}`);

        const docs: any[] = await res.json();

        return docs
            .filter(d => d.document?.fields)
            .map(d => {
                const f = d.document.fields;
                return {
                    name:  f.name?.stringValue  ?? "???",
                    score: parseInt(f.score?.integerValue ?? "0", 10),
                };
            });
    }

    // ── Navigation ────────────────────────────────────────────────

    private goBack(): void {
        this.emitter.fireEvent(GameEventType.PLAY_SOUND, { key: MenuAssets.SELECT_AUDIO_KEY });
        this.sceneManager.changeToScene(MainMenu);
    }
}