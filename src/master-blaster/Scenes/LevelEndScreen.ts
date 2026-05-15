// src/master-blaster/UI/LevelEndScreen.ts

import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import Color from "../../Wolfie2D/Utils/Color";
import { GameEventType } from "../../Wolfie2D/Events/GameEventType";
import Emitter from "../../Wolfie2D/Events/Emitter";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import Scene from "../../Wolfie2D/Scene/Scene";
import GameState from "../Scenes/GameState";

/** How long each "tick" of the score counter takes in seconds */
const TICK_INTERVAL   = 0.04;
/** How many score points to add per tick */
const SCORE_PER_TICK  = 8;
/** Delay before counting starts after screen appears */
const START_DELAY     = 0.6;
/** Seconds before the screen auto-advances to the next level */
const AUTO_ADVANCE    = 30;
/** SFX key*/
const TICK_SFX        = "SELECT_AUDIO_KEY";
const COL_GOLD = new Color(255, 215, 0);


export default class LevelEndScreen {

    private scene:    Scene;
    private emitter:  Emitter;
    private layer:    string;

    // UI refs
    private bg!:           AnimatedSprite;
    private titleLabel!:   Label;
    private timeLabel!:    Label;
    private candyLabel!:   Label;
    private healthLabel!:  Label;
    private scoreTitleLabel!: Label;   // "SCORE" header
    private scoreLabel!:   Label;      // the big number
    private promptLabel!:  Label;

    // State
    private visible:        boolean = false;
    private done:           boolean = false;  // counting finished
    private timer:          number  = 0;
    private tickTimer:      number  = 0;
    private cheatsWereOn: boolean = false;
    private isNewBest:    boolean = false;
    private cheatLabel!: Label;

    // Countdown to auto-advance 
    private autoTimer:      number  = AUTO_ADVANCE;

    private targetScore:    number  = 0;
    private displayScore:   number  = 0;

    private elapsedSeconds: number  = 0;
    private candyCollected: number  = 0;
    private candyTotal:     number  = 0;
    private healthRemaining: number = 0;
    private maxHealth:      number  = 3;

    // Callback fired when player confirms 
    private onConfirm: () => void;

    public constructor(scene: Scene, layer: string, bgSprite: AnimatedSprite, onConfirm: () => void) {
        this.scene     = scene;
        this.layer     = layer;
        this.emitter   = new Emitter();
        this.bg        = bgSprite;
        this.onConfirm = onConfirm;

        this.buildLabels();
        this.setVisible(false);
    }

    // ─────────────────────────────────────────────────────────────
    //  Layout
    //
    //   "LEVEL CLEAR!"       big title              (size 16)
    //   ─────────────────
    //   Time  00:00.00       small stat row         (size  8)
    //   Candy 0/0            small stat row         (size  8)
    //   Hearts 0/0           small stat row         (size  8)
    //   ─────────────────
    //   SCORE                medium section header  (size 10)
    //   00000                HUGE number            (size 22)
    //   ─────────────────
    //   ENTER to continue    tiny prompt            (size  7)
    // ─────────────────────────────────────────────────────────────
    private buildLabels(): void {
        const cx = 160; // center of 320px viewport
        const cy = 120; // center of 240px viewport

        const make = (text: string, x: number, y: number, size: number, color: Color): Label => {
            const lbl = <Label>this.scene.add.uiElement(UIElementType.LABEL, this.layer, {
                position: new Vec2(x, y),
                text,
            });
            lbl.textColor       = color;
            lbl.fontSize        = size;
            lbl.font            = "PixelSimple";
            lbl.backgroundColor = new Color(0, 0, 0, 0);
            return lbl;
        };

        const WHITE  = Color.WHITE;
        const YELLOW = new Color(255, 230, 80);
        const CYAN   = new Color(100, 220, 255);
        const GRAY   = new Color(180, 180, 180);

        // Title 
        this.titleLabel  = make("LEVEL CLEAR!",       cx,      cy - 68, 32, YELLOW);

        // Stat rows
        this.timeLabel   = make("TIME    0:00.00",     cx,      cy - 38,  32, GRAY);
        this.candyLabel  = make("CANDY   0 / 0",       cx,      cy - 27,  32, GRAY);
        this.healthLabel = make("HEARTS  0 / 0",       cx,      cy - 16,  32, GRAY);

        // Score section 
        this.scoreTitleLabel = make("SCORE",           cx,      cy +  20, 10, WHITE);
        this.scoreLabel      = make("0",               cx,      cy + 50, 22, WHITE);

        // Prompt
        this.promptLabel = make("ENTER to continue",   cx,      cy + 60,  20, CYAN);

        this.cheatLabel = make("CHEATS ON, score not saved", cx, cy + 72, 9, new Color(255, 80, 80));

    }

    // public api

    /** Call this when the level-end zone is triggered */
    public show(
        levelKey:        string, 
        elapsedSeconds: number,
        candyCollected: number,
        candyTotal:     number,
        healthRemaining: number,
        maxHealth:      number
    ): void {
        const state = GameState.getInstance();
        const isNewBest = !state.cheatsEnabled && state.recordScore(
            levelKey,           
            this.targetScore,
            elapsedSeconds,
            candyCollected,
            healthRemaining
        );
        this.cheatsWereOn = state.cheatsEnabled;
        this.isNewBest    = isNewBest;
        state.levelHealthAtEnd = healthRemaining;
        state.levelMaxHealth   = maxHealth;

        this.elapsedSeconds  = elapsedSeconds;
        this.candyCollected  = candyCollected;
        this.candyTotal      = candyTotal;
        this.healthRemaining = healthRemaining;
        this.maxHealth       = maxHealth;

        this.targetScore  = state.computeScore(elapsedSeconds);
        this.displayScore = 0;
        this.timer        = 0;
        this.tickTimer    = 0;
        this.done         = false;
        this.autoTimer    = AUTO_ADVANCE;
        this.visible      = true;

        // Populate static labels immediately
        const mins = Math.floor(elapsedSeconds / 60);
        const secs = Math.floor(elapsedSeconds % 60);
        const ms   = Math.floor((elapsedSeconds % 1) * 100);
        const pad2 = (v: number): string => v < 10 ? "0" + v : v.toString();

        this.timeLabel.text   = `TIME    ${mins}:${pad2(secs)}.${pad2(ms)}`;
        this.candyLabel.text  = `CANDY   ${candyCollected} / ${candyTotal}`;
        this.healthLabel.text = `HEARTS  ${healthRemaining} / ${maxHealth}`;
        this.scoreLabel.text  = "0";

        this.setVisible(true);
        this.bg.animation.play("IDLE", true);
    }

    /** Call every frame from MBLevel.updateScene while screen is visible */
    public update(deltaT: number, confirmPressed: boolean): void {
        if (!this.visible) return;

        this.timer += deltaT;
        if (this.timer < START_DELAY) return;
        // score counter
        if (!this.done) {
            this.tickTimer += deltaT;
            if (this.tickTimer >= TICK_INTERVAL) {
                this.tickTimer = 0;
                this.displayScore = Math.min(this.targetScore, this.displayScore + SCORE_PER_TICK);
                this.updateScoreLabel();
                if (this.isNewBest) {
                    this.promptLabel.text = "★ NEW BEST! ★";
                    this.promptLabel.textColor = COL_GOLD;
                }
                if (this.displayScore % 40 < SCORE_PER_TICK) {
                    this.emitter.fireEvent(GameEventType.PLAY_SOUND, {
                        key: TICK_SFX,
                        loop: false,
                        holdReference: false,
                    });
                }

                if (this.displayScore >= this.targetScore) {
                    this.displayScore = this.targetScore;
                    this.done = true;
                    this.updateScoreLabel();
                    this.emitter.fireEvent(GameEventType.PLAY_SOUND, {
                        key: "LEVEL_END_AUDIO_KEY",
                        loop: false,
                        holdReference: false,
                    });
                }
            }

            // While still counting, pressing confirm skips to final value
            if (confirmPressed) {
                this.displayScore = this.targetScore;
                this.done = true;
                this.updateScoreLabel();
            }
            return; // don't start the auto-timer until counting is done
        }

        // Auto-advance countdown
        this.autoTimer -= deltaT;
        const secsLeft = Math.ceil(Math.max(0, this.autoTimer));
        this.promptLabel.text = `ENTER to continue  (${secsLeft})`;

        // Advance — either player pressed confirm or timer ran out
        if (confirmPressed || this.autoTimer <= 0) {
            this.setVisible(false);
            this.onConfirm();
        }
    }

    public get isVisible(): boolean { return this.visible; }

    // Helpers

    private updateScoreLabel(): void {
        const score = this.displayScore;

        // Color the big number by tier
        let numColor: Color;
        if      (score >= 1000) numColor = new Color(255, 215,  0);   // gold
        else if (score >=  500) numColor = new Color( 80, 220, 80);   // green
        else                    numColor = new Color(220,  60, 60);   // red

        this.scoreLabel.text      = `${score}`;
        (this.scoreLabel as any).textColor = numColor;

        // Also tint the "SCORE" header to match
        (this.scoreTitleLabel as any).textColor = numColor;
    }

    private setVisible(v: boolean): void {
        this.bg.visible              = v;
        this.titleLabel.visible      = v;
        this.timeLabel.visible       = v;
        this.candyLabel.visible      = v;
        this.healthLabel.visible     = v;
        this.scoreTitleLabel.visible = v;
        this.scoreLabel.visible      = v;
        this.promptLabel.visible     = v;
        this.cheatLabel.visible = v && this.cheatsWereOn;

    }
}