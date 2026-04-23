/**
 * Defines a single transformation form Ditto can take.
 * All numeric fields are multipliers against the controller's base values,
 * except jumpForce which directly overrides the jump velocity.
 */
export interface Transformation {
    /** Unique key identifying this form e.g. "ROWLET", "PHANTUMP" */
    readonly key: string;
    /** Display name shown in UI */
    readonly displayName: string;

    /** Multiplier on PlayerController.speed. 1 = no change */
    readonly speedMultiplier: number;
    /** Multiplier on PlayerState.gravity. 1 = no change */
    readonly gravityMultiplier: number;
    /** Direct override for jump velocity. null = use default */
    readonly jumpForce: number | null;

    /**
     * Energy cost to activate this form.
     * Environmental tile forms should be 0.05 or less.
     * Pokemon forms range from 0.1 (weak) to 0.4 (strong).
     * Value is fraction of max energy (0–1).
     */
    readonly activationCost: number;
    /**
     * Energy drained per second while the form is active.
     * 0 means the form is free to hold once activated.
     */
    readonly drainRate: number;

    /**
     * Ability tag used by states or the level to trigger
     * special behavior. e.g. "PHASE", "GLIDE", "CLING"
     */
    readonly ability: string | null;
}

/** 
 * All forms available in the game.
 * Add new entries here as new Pokemon are introduced per level.
 */
export const Transformations: Record<string, Transformation> = {

    // ── Forest forms ──────────────────────────────────────────────
    ROWLET: {
        key: "ROWLET",
        displayName: "Rowlet",
        speedMultiplier: 1.1,
        gravityMultiplier: 0.3,   // slow fall / glide
        jumpForce: null,
        activationCost: 0.1,
        drainRate: 0.08,
        ability: "GLIDE"
    },

    PHANTUMP: {
        key: "PHANTUMP",
        displayName: "Phantump",
        speedMultiplier: 0.8,
        gravityMultiplier: 0.0,   // floats, no gravity
        jumpForce: null,
        activationCost: 0.15,
        drainRate: 0.12,
        ability: "PHASE"          // pass through thin walls
    },

    KECLEON: {
        key: "KECLEON",
        displayName: "Kecleon",
        speedMultiplier: 0.6,     // slower while camouflaged
        gravityMultiplier: 1.0,
        jumpForce: null,
        activationCost: 0.08,
        drainRate: 0.07,
        ability: "CAMOUFLAGE"
    },

    // ── Add ice/mountain forms below when we reach that level ────
    GRENINJA: {
        key: "GRENINJA",
        displayName: "Greninja",
        speedMultiplier: 1.4,           // fast ninja
        gravityMultiplier: 1.0,        
        jumpForce: -320,                // higher than the -200 base
        activationCost: 0.15,
        drainRate: 0.10,
        ability: "TONGUE_GRAPPLE"
    },
};