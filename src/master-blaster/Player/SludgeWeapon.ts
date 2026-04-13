import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import MBAnimatedSprite from "../Nodes/MBAnimatedSprite";
import OrthogonalTilemap from "../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import PlayerWeapon from "./PlayerWeapon";
import PokemonController from "../Pokemon/PokemonController";

export default class SludgeWeapon extends MBAnimatedSprite {

    public static readonly SLUDGE_KEY  = "SLUDGE";
    public static readonly SLUDGE_PATH = "game_assets/spritesheets/dittosludge.json";

    public _velocity: Vec2 = Vec2.ZERO;
    protected _gravity: number = 400;
    protected _alive: boolean = false;

    protected _tilemap: OrthogonalTilemap;
    protected _particles: PlayerWeapon;
    protected _damage: number = 1;
    protected _aoeRadius: number = 32;

    public fire(origin: Vec2, direction: Vec2, speed: number,
                tilemap: OrthogonalTilemap, particles: PlayerWeapon): void {
        this._tilemap   = tilemap;
        this._particles = particles;
        this._alive     = true;

        this.position.copy(origin);
        this._velocity  = direction.normalized().scaled(speed);
        this.visible    = true;
        this.animation.play("FLY", true);
    }

    public update(deltaT: number): void {
        if (!this._alive) return;

        
        this._velocity.y += this._gravity * deltaT;
        this.position.add(this._velocity.scaled(deltaT));

        if (this._tilemap) {
            let col = this._tilemap.getColRowAt(this.position);
            if (this._tilemap.isTileCollidable(col.x, col.y)) {
                this._splat();
                return;
            }
        }

        // Fallback — fell off screen
        if (this.position.y > 2000) {
            this._deactivate();
        }
    }

    protected _splat(): void {
        
        if (this._particles && !this._particles.isSystemRunning()) {
            this._particles.rotation = Math.PI; // pointing up
            this._particles.startSystem(500, 0, this.position.clone());
        }

        this._doAOE();
        this._deactivate();
    }

    protected _doAOE(): void {
        for (let enemy of this._enemies) {
            if (!enemy.isFainted &&
                enemy.owner.position.distanceTo(this.position) <= this._aoeRadius) {
                enemy.onHit(this._damage);
            }
        }
    }

    protected _deactivate(): void {
        this._alive    = false;
        this.visible   = false;
        this._velocity = Vec2.ZERO;
        this.animation.stop();
    }

    // --- pool of known enemies, set from the scene ---
    protected _enemies: PokemonController[] = [];
    public setEnemies(enemies: PokemonController[]): void {
        this._enemies = enemies;
    }

    public get isAlive(): boolean { return this._alive; }
}