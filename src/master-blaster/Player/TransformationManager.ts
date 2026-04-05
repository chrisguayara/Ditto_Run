import Emitter from "../../Wolfie2D/Events/Emitter";
import MathUtils from "../../Wolfie2D/Utils/MathUtils";
import { MBEvents } from "../MBEvents";
import { Transformation, Transformations } from "./Transformation";

export default class TransformationManager {

    // ── Energy ────────────────────────────────────────────────────
    private _energy: number;
    private _maxEnergy: number;
    private readonly RECHARGE_RATE = 0.05; // energy per second while inactive

    // ── Forms ─────────────────────────────────────────────────────
    /** All forms the player has discovered and can use */
    private _unlockedForms: Transformation[];
    /** Index into _unlockedForms for the currently selected (but not necessarily active) form */
    private _selectedIndex: number;
    /** The form currently active, null if Ditto is in base form */
    private _activeForm: Transformation | null;

    private emitter: Emitter;

    public constructor() {
        this._maxEnergy = 1.0;
        this._energy = 1.0;
        this._unlockedForms = [];
        this._selectedIndex = 0;
        this._activeForm = null;
        this.emitter = new Emitter();
    }

    // ── Public API ────────────────────────────────────────────────

    /** Call this every frame from PlayerController.update() */
    public update(deltaT: number): void {
        if (this._activeForm) {
            // Drain energy while a form is held
            this.energy -= this._activeForm.drainRate * deltaT;

            // Auto-cancel if energy runs out
            if (this._energy <= 0) {
                this.deactivate();
            }
        } else {
            // Recharge when no form is active
            this.energy += this.RECHARGE_RATE * deltaT;
        }
    }

    /**
     * Try to activate the currently selected form.
     * Returns false if there's not enough energy or no form is selected.
     */
    public activate(): boolean {
        if (this._unlockedForms.length === 0) return false;

        const form = this._unlockedForms[this._selectedIndex];
        if (this._energy < form.activationCost) return false;

        // Pay the activation cost
        this.energy -= form.activationCost;
        this._activeForm = form;

        this.emitter.fireEvent(MBEvents.TRANSFORM_START, { form: form.key });
        return true;
    }

    /** Manually cancel the active form */
    public deactivate(): void {
        if (!this._activeForm) return;
        this._activeForm = null;
        this.emitter.fireEvent(MBEvents.TRANSFORM_END, {});
    }

    /** Toggle if a form is active deactivate it, otherwise activate selected */
    public toggle(): void {
        this._activeForm ? this.deactivate() : this.activate();
    }

    /** Cycle to the next unlocked form */
    public cycleNext(): void {
        if (this._unlockedForms.length === 0) return;
        // Deactivate current form before switching
        if (this._activeForm) this.deactivate();
        this._selectedIndex = (this._selectedIndex + 1) % this._unlockedForms.length;
    }

    /** Add a form by key. Call this when Ditto defeats or touches a Pokemon */
    public unlockForm(key: string): void {
        const form = Transformations[key];
        if (!form) return;
        // Don't add duplicates
        if (this._unlockedForms.find(f => f.key === key)) return;
        this._unlockedForms.push(form);
    }

    // ── Stat accessors used by PlayerController ───────────────────

    /** Speed multiplier from active form, 1.0 if no form */
    public get speedMultiplier(): number {
        return this._activeForm?.speedMultiplier ?? 1.0;
    }

    /** Gravity multiplier from active form, 1.0 if no form */
    public get gravityMultiplier(): number {
        return this._activeForm?.gravityMultiplier ?? 1.0;
    }

    /** Jump force override, null means use controller default */
    public get jumpForce(): number | null {
        return this._activeForm?.jumpForce ?? null;
    }

    /** Ability tag of the active form, null if none */
    public get activeAbility(): string | null {
        return this._activeForm?.ability ?? null;
    }

    public get activeForm(): Transformation | null { return this._activeForm; }
    public get selectedForm(): Transformation | null {
        return this._unlockedForms[this._selectedIndex] ?? null;
    }
    public get unlockedForms(): Transformation[] { return [...this._unlockedForms]; }

    // ── Energy with clamping + event ──────────────────────────────
    public get energy(): number { return this._energy; }
    public set energy(value: number) {
        this._energy = MathUtils.clamp(value, 0, this._maxEnergy);
        this.emitter.fireEvent(MBEvents.ENERGY_CHANGE, {
            cur: this._energy,
            max: this._maxEnergy
        });
    }

    public get maxEnergy(): number { return this._maxEnergy; }
}