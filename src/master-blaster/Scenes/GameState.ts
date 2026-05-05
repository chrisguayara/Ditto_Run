// src/mb_game/Scenes/GameState.ts

export default class GameState {
    private static instance: GameState;

    public cheatsUnlockAll: boolean = false;
    public cheatsInfiniteHealth: boolean = false;
    public hasPlayedBefore: boolean = false;

    
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
}