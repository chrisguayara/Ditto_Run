/**
 * A set of events for Master Blaster
 */
export const MBEvents = {
    // An event that tells the MB level to start. Has data: {}
    LEVEL_START: "LEVEL_START",
    // An event that tells the MB level to end. Has data: {}
    LEVEL_END: "LEVEL_END",

    // An event triggered when the player enters an area designated as a "level end" location. Had data: {}
    PLAYER_ENTERED_LEVEL_END: "PLAYER_ENTERED_LEVEL_END",

    /**
     * The event that gets emitted when the player's health changes
     * 
     * Has data: { curhp: number, maxhp: number }
     */
    HEALTH_CHANGE: "HEALTH_CHANGE",

    // The event sent when a particle hits a tile in the destructible tilemap layer
    PARTICLE_HIT_DESTRUCTIBLE: "PARTICLE_HIT_DESTRUCTIBLE",
    PLAYER_ENTERED_CHECKPOINT: "PLAYER_ENTERED_CHECKPOINT",

    // The event sent when the player dies. Gets sent after the player's death animation
    PLAYER_DEAD: "PLAYER_DEAD",
    // Has data: { form: string }
    TRANSFORM_START: "TRANSFORM_START",
    // Has data: {}
    TRANSFORM_END: "TRANSFORM_END",
    // Has data: { cur: number, max: number }
    ENERGY_CHANGE: "ENERGY_CHANGE",
    FORM_SELECTED: "FORM_SELECTED",
    PLAYER_HIT_DAMAGE_TILE: "PLAYER_HIT_DAMAGE_TILE",

    PLAYER_HIT_ENTITY: "PLAYER_HIT_ENTITY",
    PLAYER_HEAL: "PLAYER_HEAL",
    PLAYER_BOUNCE: "PLAYER_BOUNCE",
    PLAYER_ENERGY_RESTORE: "PLAYER_ENERGY_RESTORE",
    POKEMON_HIT:                  "POKEMON_HIT",  
} as const;
