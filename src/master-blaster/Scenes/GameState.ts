// src/mb_game/Scenes/GameState.ts
import ScoreManager from "./ScoreManager";
import { FIRESTORE_BASE } from "./FirebaseConfig";

export default class GameState {
    private static instance: GameState;

    public cheatsUnlockAll: boolean = false;
    public cheatsInfiniteHealth: boolean = false;
    public hasPlayedBefore: boolean = false;
    public levelCandyTotal: number = 0;      
    public levelCandyCollected: number = 0; 
    public levelStartTime: number = 0;      
    public levelHealthAtEnd: number = 3;     
    public levelMaxHealth: number = 3;
    public playerName: string = "";
    
    public unlockedLevels: Set<string> = new Set(["WINTER"]); 

    private constructor() {}

    public static getInstance(): GameState {
        if (!GameState.instance) {
            GameState.instance = new GameState();
        }
        return GameState.instance;
    }

    public isLevelUnlocked(label: string): boolean {
        if (this.cheatsUnlockAll) return true;
        return this.unlockedLevels.has(label);
    }

    public unlockLevel(label: string): void {
        this.unlockedLevels.add(label);
    }
    public resetLevelStats(totalCandies: number): void {
    this.levelCandyTotal     = totalCandies;
    this.levelCandyCollected = 0;
    }

    public recordCandyCollected(): void {
        this.levelCandyCollected++;
    }

    public computeScore(elapsedSeconds: number): number {
        // Time score: 600 points, decays from 0s to 300s (5 min = 0 time pts)
        const timeScore    = Math.max(0, Math.round(600 * (1 - elapsedSeconds / 300)));
        const candyScore   = this.levelCandyTotal > 0
            ? Math.round((this.levelCandyCollected / this.levelCandyTotal) * 200)
            : 200; // no candies in level = free points
        const healthScore  = Math.round((this.levelHealthAtEnd / this.levelMaxHealth) * 200);
        return Math.min(1000, timeScore + candyScore + healthScore);
    }
   public async recordScore(
    level:  string,
    score:  number,
    time:   number,
    candy:  number,
    health: number
    ): Promise<"new_best" | "top_three" | "none"> {
        const sm     = ScoreManager.getInstance();
        const result = sm.tryRecord(
            level as any, score, time, candy, health,
            this.cheatsEnabled
        );
        console.log(`[recordScore] level=${level} score=${score} cheats=${this.cheatsEnabled} name="${this.playerName}"`);

        if (!this.cheatsEnabled) {
            // ── Submit individual run to Scores collection (existing) ──
            try {
                await fetch(`${FIRESTORE_BASE}/Scores`, {
                    method:  "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        fields: {
                            level:  { stringValue:  level              },
                            score:  { integerValue: String(score)      },
                            time:   { doubleValue:  time               },
                            candy:  { integerValue: String(candy)      },
                            health: { integerValue: String(health)     },
                        }
                    })
                });
            } catch (e) {
                console.warn("Score submit failed:", e);
            }

            // ── Submit cumulative total to Leaderboard collection ──────
            // Only submit if the player has entered their name this session.
            if (this.playerName) {
                try {
                    const cumulative = sm.getCumulativeTotal();
                    await fetch(`${FIRESTORE_BASE}/Leaderboard`, {
                        method:  "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            fields: {
                                name:  { stringValue:  this.playerName          },
                                score: { integerValue: String(cumulative)       },
                                ts:    { integerValue: String(Date.now())       },
                            }
                        })
                    });
                } catch (e) {
                    console.warn("Leaderboard submit failed:", e);
                }
            }
        }

        return result;
    }

    public get cheatsEnabled(): boolean {
        return this.cheatsUnlockAll || this.cheatsInfiniteHealth;
    }
}