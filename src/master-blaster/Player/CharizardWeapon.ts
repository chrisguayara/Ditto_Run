import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import OrthogonalTilemap from "../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import MBAnimatedSprite from "../Nodes/MBAnimatedSprite";

// ─── Result types ─────────────────────────────────────────────────────────────

export const enum CharizardAttackResult {
    /** Aimed at ground within range → rocket upward */
    ROCKET_JUMP = "ROCKET_JUMP",
    /** Aimed at a nearby wall → launch in the reflected direction */
    WALL_LAUNCH = "WALL_LAUNCH",
    /** Fire blast struck a pokemon */
    HIT_ENTITY  = "HIT_ENTITY",
    /** Nothing in range */
    MISS        = "MISS",
}

export interface CharizardAttackData {
    result:    CharizardAttackResult;
    /** Velocity to assign directly to the player. Vec2.ZERO for MISS. */
    impulse:   Vec2;
    /** Sprite ID of the struck pokemon, set only when result === HIT_ENTITY. */
    entityId?: number;
}

// ─── Fire-breakable tile IDs ──────────────────────────────────────────────────
//
// Add tile IDs from the destructible layer that Charizard's blast can remove.
// These are SEPARATE from the tiles the normal PlayerWeapon particle breaks.
// Example:  new Set([14, 15, 16])
//
export const CHARIZARD_BREAKABLE_TILE_IDS: ReadonlySet<number> = new Set([
    // TODO: populate with your fire-breakable tile IDs
]);

// ─── Tuning ───────────────────────────────────────────────────────────────────

/** Step size (px) for the ray march. Smaller = more precise, more expensive. */
const RAY_STEP = 4;

/**
 * How far below the player's feet (px) to look for ground.
 * Covers standing on ground AND being a couple of tiles above it mid-air.
 */
const GROUND_RAY_LENGTH = 48;

/** How far in the click direction (px) to look for a wall. */
const WALL_RAY_LENGTH   = 52;

/**
 * The click direction's Y component must be ≥ this for it to count as
 * "aimed at the ground" (positive Y = downward in screen-space).
 * 0.35 ≈ within ~70° of straight down.
 */
const GROUND_ANGLE_THRESHOLD = 0.35;

/** Upward velocity after a rocket jump (negative = up). */
const ROCKET_JUMP_VY     = -520;
/** Max horizontal nudge on rocket jump, opposing the click X. */
const ROCKET_JUMP_VX_MAX =  140;

/** Launch speed for a wall bounce. */
const WALL_LAUNCH_SPEED  =  420;
/** Extra upward boost so even a flat wall-hit gets some height. */
const WALL_LAUNCH_VY_BONUS = -80;

/** Hit-sphere radius (px) for entity detection along the ray. */
const ENTITY_HIT_RADIUS = 14;
/** Max range for entity hits. */
const ENTITY_RAY_LENGTH = WALL_RAY_LENGTH + 16;

/** Small rebound impulse applied to the player when hitting an entity. */
const ENTITY_REBOUND_SPEED = 60;

// ─── Main class ───────────────────────────────────────────────────────────────

export default class CharizardWeapon {

    /**
     * Call this inside BlitzState.onEnter.
     *
     * @param playerPos      Centre of the player sprite (world-space)
     * @param mouseWorldPos  Input.getGlobalMousePosition() — already world-space
     * @param walls          The solid tilemap layer (OrthogonalTilemap)
     * @param destructable   The destructible tilemap layer (may be undefined)
     * @param pokemonOwners  Live pokemon sprites for entity hit-detection
     */
    static processAttack(
        playerPos:     Vec2,
        mouseWorldPos: Vec2,
        walls:         OrthogonalTilemap,
        destructable:  OrthogonalTilemap | undefined,
        pokemonOwners: MBAnimatedSprite[],
    ): CharizardAttackData {

        const dx   = mouseWorldPos.x - playerPos.x;
        const dy   = mouseWorldPos.y - playerPos.y;
        const dist = Math.hypot(dx, dy);

        // Normalised direction toward mouse (guard zero-length)
        const dirX = dist > 0.001 ? dx / dist : 0;
        const dirY = dist > 0.001 ? dy / dist : 1;   // default: straight down

        // ── 1. Entity hit (highest priority — feels responsive) ────────────
        const hit = CharizardWeapon.raycastEntity(
            playerPos, dirX, dirY, pokemonOwners
        );
        if (hit) {
            // Rebound away from the struck entity
            return {
                result:   CharizardAttackResult.HIT_ENTITY,
                impulse:  new Vec2(-dirX * ENTITY_REBOUND_SPEED, -ENTITY_REBOUND_SPEED * 0.5),
                entityId: hit.id,
            };
        }

        // ── 2. Ground attack → rocket jump ────────────────────────────────
        if (dirY >= GROUND_ANGLE_THRESHOLD) {
            const groundHit = CharizardWeapon.raycastDown(playerPos, walls, destructable);
            if (groundHit) {
                CharizardWeapon.destroyFireTiles(playerPos, dirX, dirY, destructable);
                return {
                    result:  CharizardAttackResult.ROCKET_JUMP,
                    impulse: new Vec2(-dirX * ROCKET_JUMP_VX_MAX, ROCKET_JUMP_VY),
                };
            }
        }

        // ── 3. Wall attack → wall launch ──────────────────────────────────
        const wallNormal = CharizardWeapon.raycastWall(playerPos, dirX, dirY, walls);
        if (wallNormal) {
            CharizardWeapon.destroyFireTiles(playerPos, dirX, dirY, destructable);

            // Reflect click direction off wall normal
            const dot    = dirX * wallNormal.x + dirY * wallNormal.y;
            const reflX  = dirX - 2 * dot * wallNormal.x;
            const reflY  = dirY - 2 * dot * wallNormal.y;
            const reflLen = Math.hypot(reflX, reflY);
            const lx = reflLen > 0 ? reflX / reflLen : 0;
            const ly = reflLen > 0 ? reflY / reflLen : -1;

            return {
                result:  CharizardAttackResult.WALL_LAUNCH,
                impulse: new Vec2(
                    lx * WALL_LAUNCH_SPEED,
                    ly * WALL_LAUNCH_SPEED + WALL_LAUNCH_VY_BONUS,
                ),
            };
        }

        // ── 4. Nothing ─────────────────────────────────────────────────────
        return { result: CharizardAttackResult.MISS, impulse: new Vec2(0, 0) };
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Walk straight down from the player's feet and check for any solid tile
     * within GROUND_RAY_LENGTH.
     */
    private static raycastDown(
        playerPos:    Vec2,
        walls:        OrthogonalTilemap,
        destructable?: OrthogonalTilemap,
    ): boolean {
        // Player half-height is 16 px (from initializePlayer AABB)
        const feetY = playerPos.y + 16;
        for (let dy = 2; dy <= GROUND_RAY_LENGTH; dy += RAY_STEP) {
            const p = new Vec2(playerPos.x, feetY + dy);
            if (CharizardWeapon.isSolid(p, walls, destructable)) return true;
        }
        return false;
    }

    /**
     * March along the click direction and check for a solid tile on the walls
     * layer within WALL_RAY_LENGTH.
     *
     * @returns the outward wall-face normal, or null if nothing was hit.
     */
    private static raycastWall(
        origin: Vec2,
        dirX:   number,
        dirY:   number,
        walls:  OrthogonalTilemap,
    ): Vec2 | null {

        let prevX = origin.x;
        let prevY = origin.y;

        for (let d = RAY_STEP; d <= WALL_RAY_LENGTH; d += RAY_STEP) {
            const px = origin.x + dirX * d;
            const py = origin.y + dirY * d;

            // Only check walls (not destructable) — we want to bounce off solid geometry.
            if (CharizardWeapon.isSolid(new Vec2(px, py), walls)) {
                const stepX = px - prevX;
                const stepY = py - prevY;
                // Normal is perpendicular to the face we entered
                const normal = Math.abs(stepX) >= Math.abs(stepY)
                    ? new Vec2(stepX < 0 ? 1 : -1, 0)
                    : new Vec2(0, stepY < 0 ? 1 : -1);
                return normal;
            }

            prevX = px;
            prevY = py;
        }
        return null;
    }

    /**
     * Sphere-sweep along the ray and return the first pokemon sprite hit,
     * or null if none are within range.
     */
    private static raycastEntity(
        origin:  Vec2,
        dirX:    number,
        dirY:    number,
        sprites: MBAnimatedSprite[],
    ): MBAnimatedSprite | null {

        for (const sprite of sprites) {
            if (!sprite.visible) continue;

            const toX = sprite.position.x - origin.x;
            const toY = sprite.position.y - origin.y;

            // Scalar projection onto the ray
            const along = toX * dirX + toY * dirY;
            if (along < 0 || along > ENTITY_RAY_LENGTH) continue;

            // Perpendicular distance from sprite centre to the ray line
            const closestX = origin.x + dirX * along;
            const closestY = origin.y + dirY * along;
            const perpDist = Math.hypot(
                sprite.position.x - closestX,
                sprite.position.y - closestY,
            );

            if (perpDist < ENTITY_HIT_RADIUS) return sprite;
        }
        return null;
    }

    /**
     * Remove tiles from the destructible layer along the ray whose IDs are
     * listed in CHARIZARD_BREAKABLE_TILE_IDS.
     */
    private static destroyFireTiles(
        origin:       Vec2,
        dirX:         number,
        dirY:         number,
        destructable?: OrthogonalTilemap,
    ): void {
        if (!destructable || CHARIZARD_BREAKABLE_TILE_IDS.size === 0) return;

        for (let d = 0; d <= WALL_RAY_LENGTH + 8; d += RAY_STEP) {
            const p  = new Vec2(origin.x + dirX * d, origin.y + dirY * d);

            let tileId: number;
            try {
                tileId = destructable.getTileAtWorldPosition(p);
            } catch {
                continue;
            }

            if (CHARIZARD_BREAKABLE_TILE_IDS.has(tileId)) {
                const rc = destructable.getColRowAt(p);
                destructable.setTileAtRowCol(rc, 0);
            }
        }
    }

    /**
     * Returns true if world-position `p` sits on a collidable tile.
     * Mirrors the approach in GreninjaTongueGrapple.hitsTile.
     */
    private static isSolid(
        p:            Vec2,
        walls:        OrthogonalTilemap,
        destructable?: OrthogonalTilemap,
    ): boolean {
        try {
            if (walls.getTileAtWorldPosition(p) > 0) return true;
        } catch { /* out of bounds */ }

        if (destructable) {
            try {
                if (destructable.getTileAtWorldPosition(p) > 0) return true;
            } catch { /* out of bounds */ }
        }
        return false;
    }
}