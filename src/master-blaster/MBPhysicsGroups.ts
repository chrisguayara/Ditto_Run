/**
 * An enum with all of the physics groups for Master Blaster
 */
export const MBPhysicsGroups = {
    // Physics groups for the player and the player's weapon
    PLAYER: "PLAYER",
    PLAYER_WEAPON: "WEAPON",
    PLAYER_PHANTUMP: "PLAYER_PHANTUMP",
    /* 
        Physics groups for the different tilemap layers. Physics groups for tilemaps are
        embedded in the tilemap layer data by a property called "Group". This lets you
        set the physics group for a particular tilemap layer.
    */
    GROUND: "GROUND",
    DESTRUCTABLE: "DESTRUCTABLE",
    PHANTOM_WALL: "PHANTOM_WALL",
    DAMAGE_WALL: "DAMAGE_WALL",
} as const;