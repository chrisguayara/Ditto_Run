export const SpriteKeys = {
    // ── Enemies ──────────────────────────────────────────────────
    PATROLLER_KEY:  "PATROLLER_KEY",
    PATROLLER_PATH: "game_assets/spritesheets/entities/patroller.json",
 
    SHOOTER_KEY:    "SHOOTER_KEY",
    SHOOTER_PATH:   "game_assets/spritesheets/entities/shooter.json",
 
    // ── Projectiles ───────────────────────────────────────────────
    // Single spritesheet with SNOWBALL and FIREBALL animations
    PROJECTILE_KEY:  "PROJECTILE_KEY",
    PROJECTILE_PATH: "game_assets/spritesheets/entities/projectile.json",
 
    // ── Items ─────────────────────────────────────────────────────
    SHIELD_CANDY_KEY:  "SHIELD_CANDY_KEY",
    SHIELD_CANDY_PATH: "game_assets/spritesheets/entities/shield.json",
} as const;
 
export type SpriteKey = typeof SpriteKeys[keyof typeof SpriteKeys];