// src/master-blaster/Scenes/ScoreManager.ts

const STORAGE_KEY = "ditto_run_scores";

export interface LevelScore {
    score:   number;
    time:    number;   // seconds
    candy:   number;
    health:  number;
}

export interface ScoreData {
    // Best score per level
    levels: Record<string, LevelScore>;
    // Cumulative total of all best scores added together
    total: number;
}

const LEVEL_KEYS = ["WINTER", "CASTLE", "MOUNTAIN", "SKY_TEMPLE"] as const;
export type LevelKey = typeof LEVEL_KEYS[number];

export default class ScoreManager {

    private static instance: ScoreManager;
    private data: ScoreData;

    private constructor() {
        this.data = this.load();
    }

    public static getInstance(): ScoreManager {
        if (!ScoreManager.instance) {
            ScoreManager.instance = new ScoreManager();
        }
        return ScoreManager.instance;
    }

    // ── Read ──────────────────────────────────────────────────────

    public getBestScore(level: LevelKey): LevelScore | null {
        return this.data.levels[level] ?? null;
    }

    public getCumulativeTotal(): number {
        return this.data.total;
    }

    public getAllLevelKeys(): readonly string[] {
        return LEVEL_KEYS;
    }

    // ── Write ─────────────────────────────────────────────────────

    /**
     * Attempt to record a score for a level.
     * Returns false and does nothing if cheats are enabled.
     * Returns true if the score was a new best and was saved.
     */
    public tryRecord(
        level:       LevelKey,
        score:       number,
        time:        number,
        candy:       number,
        health:      number,
        cheatsOn:    boolean,
    ): boolean {
        if (cheatsOn) return false;

        const prev = this.data.levels[level];
        if (prev && prev.score >= score) return false; // not a new best

        // Remove old best from total before adding new one
        if (prev) this.data.total -= prev.score;
        this.data.total += score;

        this.data.levels[level] = { score, time, candy, health };
        this.save();
        return true;
    }

    public clearAll(): void {
        this.data = { levels: {}, total: 0 };
        this.save();
    }

    // ── localStorage ──────────────────────────────────────────────

    private load(): ScoreData {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return JSON.parse(raw) as ScoreData;
        } catch { /* ignore parse errors */ }
        return { levels: {}, total: 0 };
    }

    private save(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        } catch { /* storage full or blocked */ }
    }
}