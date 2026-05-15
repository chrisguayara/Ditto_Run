const STORAGE_KEY = "ditto_run_scores";
const TOP_N = 3;

export interface LevelScore {
    score:  number;
    time:   number;
    candy:  number;
    health: number;
}

export interface ScoreData {
    levels: Record<string, LevelScore[]>; // top N scores per level
    total:  number;                       // sum of #1 scores across all levels
}

const LEVEL_KEYS = ["WINTER", "CASTLE", "MOUNTAIN", "SKY_TEMPLE"] as const;
export type LevelKey = typeof LEVEL_KEYS[number];

export default class ScoreManager {

    private static instance: ScoreManager;
    private data: ScoreData;

    private constructor() { this.data = this.load(); }

    public static getInstance(): ScoreManager {
        if (!ScoreManager.instance) {
            ScoreManager.instance = new ScoreManager();
        }
        return ScoreManager.instance;
    }

    // ── Read ──────────────────────────────────────────────────────

    /** Top N scores for a level, sorted best first */
    public getTopScores(level: LevelKey): LevelScore[] {
        return this.data.levels[level] ?? [];
    }

    /** Convenience — just the #1 score */
    public getBestScore(level: LevelKey): LevelScore | null {
        return this.getTopScores(level)[0] ?? null;
    }

    public getCumulativeTotal(): number { return this.data.total; }
    public getAllLevelKeys(): readonly string[] { return LEVEL_KEYS; }

    // ── Write ─────────────────────────────────────────────────────

    /**
     * Returns "new_best" | "top_three" | "none"
     * "new_best"   — beat #1 score
     * "top_three"  — made the top 3 but not #1
     * "none"       — cheats on, or score didn't make the list
     */
    public tryRecord(
        level:    LevelKey,
        score:    number,
        time:     number,
        candy:    number,
        health:   number,
        cheatsOn: boolean,
    ): "new_best" | "top_three" | "none" {
        if (cheatsOn) return "none";

        const entry: LevelScore = { score, time, candy, health };
        const list = this.data.levels[level] ?? [];

        // Insert in sorted order (highest score first)
        const insertIdx = list.findIndex(s => s.score < score);
        if (insertIdx === -1) {
            if (list.length < TOP_N) {
                list.push(entry);
            } else {
                return "none"; // didn't make the list
            }
        } else {
            list.splice(insertIdx, 0, entry);
        }

        // Keep only top N
        if (list.length > TOP_N) list.splice(TOP_N);
        this.data.levels[level] = list;

        // Update cumulative total using new #1
        const oldBest = insertIdx === 0 
            ? (list[1]?.score ?? 0)   // we just displaced the old #1
            : (list[0]?.score ?? 0);  // #1 didn't change

        if (insertIdx === 0) {
            // New #1 — update total
            const displaced = list[1]?.score ?? 0;
            this.data.total = this.data.total - displaced + score;
        }

        this.save();
        return insertIdx === 0 ? "new_best" : "top_three";
    }

    public clearAll(): void {
        this.data = { levels: {}, total: 0 };
        this.save();
    }

    private load(): ScoreData {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as any;
                // Migrate old format (single best score) to new format (array)
                if (parsed.levels) {
                    for (const key of Object.keys(parsed.levels)) {
                        if (!Array.isArray(parsed.levels[key])) {
                            parsed.levels[key] = [parsed.levels[key]];
                        }
                    }
                }
                return parsed as ScoreData;
            }
        } catch { /* ignore */ }
        return { levels: {}, total: 0 };
    }

    private save(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        } catch { /* storage full */ }
    }
}