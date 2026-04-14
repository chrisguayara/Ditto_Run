// SludgeWeapon.ts
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import MBAnimatedSprite from "../Nodes/MBAnimatedSprite";
import OrthogonalTilemap from "../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import PlayerWeapon from "./PlayerWeapon";
import PokemonController from "../Pokemon/PokemonController";

export default class SludgeWeapon {

    public static readonly SLUDGE_KEY  = "SLUDGE";
    public static readonly SLUDGE_PATH = "game_assets/spritesheets/dittosludge.json";

    private _sprite: MBAnimatedSprite;
    private _velocity: Vec2 = Vec2.ZERO;
    private readonly _gravity: number = 40;
    private _alive: boolean = false;
    private _tilemap: OrthogonalTilemap;
    private _particles: PlayerWeapon;
    private _damage: number = 1;
    private _aoeRadius: number = 32;
    private _enemies: PokemonController[] = [];

    public constructor(sprite: MBAnimatedSprite) {
        this._sprite = sprite;
    }

    public fire(origin: Vec2, direction: Vec2, speed: number,
                tilemap: OrthogonalTilemap, particles: PlayerWeapon): void {
        this._tilemap  = tilemap;
        this._particles = particles;
        this._alive    = true;
        this._sprite.position.copy(origin);
        this._velocity = direction.normalized().scaled(speed);
        this._sprite.visible = true;
        this._sprite.animation.play("DEFAULT", true);
    }

    public update(deltaT: number): void {
        if (!this._alive) return;

        this._velocity.y += this._gravity * deltaT;
        this._sprite.position.add(this._velocity.scaled(deltaT));

        if (this._tilemap) {
            const col = this._tilemap.getColRowAt(this._sprite.position);
            if (this._tilemap.isTileCollidable(col.x, col.y)) {
                this._splat();
                return;
            }
        }

        if (this._sprite.position.y > 2000) {
            this._deactivate();
        }
    }

    private _splat(): void {
        if (this._particles && !this._particles.isSystemRunning()) {
            this._particles.rotation = Math.PI;
            this._particles.startSystem(500, 0, this._sprite.position.clone());
        }
        this._doAOE();
        this._deactivate();
    }

    private _doAOE(): void {
        for (let enemy of this._enemies) {
            if (!enemy.isFainted &&
                enemy.position.distanceTo(this._sprite.position) <= this._aoeRadius) {
                enemy.onHit(this._damage);
            }
        }
    }

    private _deactivate(): void {
        this._alive = false;
        this._sprite.visible = false;
        this._velocity = Vec2.ZERO;
        this._sprite.animation.stop();
    }

    public setEnemies(enemies: PokemonController[]): void { this._enemies = enemies; }
    public get isAlive(): boolean { return this._alive; }
}