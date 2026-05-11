// src/mb_game/Scenes/GameState.ts

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
}