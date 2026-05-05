export interface ProjectileConfig {
    speed: number;
    damage: number;
    drag: number;           
    slowOnHit: boolean;     
    slowDuration: number;   
    slowMultiplier: number; 
    spriteAnim: string;     
}

export const SNOWBALL: ProjectileConfig = {
    speed: 180,
    damage: 1,
    drag: 0.84,
    slowOnHit: true,
    slowDuration: 2.0,
    slowMultiplier: 0.45,
    spriteAnim: "SNOWBALL",
};

export const FIREBALL: ProjectileConfig = {
    speed: 340,
    damage: 2,
    drag: 0.9995,           
    slowOnHit: false,
    slowDuration: 0,
    slowMultiplier: 1.0,
    spriteAnim: "FIREBALL",
};