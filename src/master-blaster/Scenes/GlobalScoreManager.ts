// src/master-blaster/Scenes/GlobalScoreManager.ts

const FIRESTORE_URL = "https://firestore.googleapis.com/v1/projects/ditto-run/databases/(default)/documents";

export interface GlobalEntry {
    name:   string;
    score:  number;
    time:   number;
    candy:  number;
    health: number;
    level:  string;
}

export default class GlobalScoreManager {

    private static instance: GlobalScoreManager;
    public static getInstance(): GlobalScoreManager {
        if (!GlobalScoreManager.instance) {
            GlobalScoreManager.instance = new GlobalScoreManager();
        }
        return GlobalScoreManager.instance;
    }

    /** Submit a score to the global leaderboard */
    public async submitScore(entry: GlobalEntry): Promise<void> {
        try {
            await fetch(`${FIRESTORE_URL}/scores`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fields: {
                        name:   { stringValue: entry.name   },
                        score:  { integerValue: String(entry.score)  },
                        time:   { doubleValue:  entry.time   },
                        candy:  { integerValue: String(entry.candy)  },
                        health: { integerValue: String(entry.health) },
                        level:  { stringValue: entry.level  },
                    }
                })
            });
        } catch (e) {
            console.warn("Failed to submit global score:", e);
        }
    }

    /** Fetch top 50 scores for a given level, sorted by score descending */
    public async getTopScores(level: string): Promise<GlobalEntry[]> {
        try {
            const res = await fetch(
                `${FIRESTORE_URL}:runQuery`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        structuredQuery: {
                            from:    [{ collectionId: "scores" }],
                            where:   {
                                fieldFilter: {
                                    field: { fieldPath: "level" },
                                    op:    "EQUAL",
                                    value: { stringValue: level }
                                }
                            },
                            orderBy: [{ field: { fieldPath: "score" }, direction: "DESCENDING" }],
                            limit:   50
                        }
                    })
                }
            );
            const rows = await res.json() as any[];
            return rows
                .filter(r => r.document)
                .map(r => {
                    const f = r.document.fields;
                    return {
                        name:   f.name.stringValue,
                        score:  parseInt(f.score.integerValue),
                        time:   f.time.doubleValue,
                        candy:  parseInt(f.candy.integerValue),
                        health: parseInt(f.health.integerValue),
                        level:  f.level.stringValue,
                    };
                });
        } catch (e) {
            console.warn("Failed to fetch global scores:", e);
            return [];
        }
    }
}