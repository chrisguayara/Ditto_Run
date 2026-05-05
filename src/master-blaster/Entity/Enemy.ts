import Entity from "./Entity";
import MBAnimatedSprite from "../Nodes/MBAnimatedSprite";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";

export default abstract class Enemy extends Entity {
    protected _health: number;
    protected _maxHealth: number;
    protected _contactDamage: number;
    protected _isFainted: boolean = false;

    private hitFlashTimer: number = 0;
    private readonly HIT_FLASH_DURATION = 0.12;

    constructor(sprite: MBAnimatedSprite, maxHealth: number, contactDamage: number) {
        super(sprite);
        this._maxHealth = maxHealth;
        this._health = maxHealth;
        this._contactDamage = contactDamage;
    }

    // ── Entity contract ───────────────────────────────────────────

    // Subclasses still define what happens on player touch,
    // but default behavior is just dealing contact damage.
    public onPlayerContact(): void {
        if (this._isFainted) return;
        // MBLevel reads contactDamage directly off the pokemonMap controllers,
        // but entityMap enemies go through onPlayerContact — so we fire the event here.
        this.emitter.fireEvent("PLAYER_HIT_ENTITY_DAMAGE", { damage: this._contactDamage });
    }

    // ── Enemy-specific API ────────────────────────────────────────

    public onHit(damage: number): void {
        if (this._isFainted) return;
        this._health -= damage;
        this.hitFlashTimer = this.HIT_FLASH_DURATION;

        if (this._health <= 0) {
            this._health = 0;
            this._isFainted = true;
            this.consumed = true; // reuse Entity's consumed flag — stops further contact
            this.onFaint();
        }
    }

    /** Override to play death animation, drop items, etc. */
    protected abstract onFaint(): void;

    public get isFainted(): boolean { return this._isFainted; }
    public get contactDamage(): number { return this._contactDamage; }

    // ── Shared per-frame logic — call super.update(deltaT) in subclasses ──

    public update(deltaT: number): void {
        if (this._isFainted) return;

        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= deltaT;
            this.sprite.alpha = Math.floor(this.hitFlashTimer / 0.03) % 2 === 0 ? 0.3 : 1.0;
            if (this.hitFlashTimer <= 0) {
                this.sprite.alpha = 1.0;
            }
        }
    }
}