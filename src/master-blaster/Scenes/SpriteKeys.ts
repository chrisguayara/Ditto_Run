export const SpriteKeys = {
    PATROLLER_KEY:  "PATROLLER_KEY",
    PATROLLER_PATH: "game_assets/spritesheets/entities/patroller.json",

    SHOOTER_KEY:    "SHOOTER_KEY",
    SHOOTER_PATH:   "game_assets/spritesheets/entities/shooter.json",

    PROJECTILE_KEY:  "PROJECTILE_KEY",
    PROJECTILE_PATH: "game_assets/spritesheets/entities/projectile.json",

    SHIELD_CANDY_KEY:  "SHIELD_CANDY_KEY",
    SHIELD_CANDY_PATH: "game_assets/spritesheets/entities/shield.json",

    // Gengar
    GENGAR_KEY:  "GENGAR_KEY",
    GENGAR_PATH: "game_assets/spritesheets/entities/gengar.json",
} as const;

export type SpriteKey = typeof SpriteKeys[keyof typeof SpriteKeys];