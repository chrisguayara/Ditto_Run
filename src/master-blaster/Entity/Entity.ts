// src/master-blaster/Entities/Entity.ts
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import MBAnimatedSprite from "../Nodes/MBAnimatedSprite";
import { MBEvents } from "../MBEvents";
import Emitter from "../../Wolfie2D/Events/Emitter";
import AABB from "../../Wolfie2D/DataTypes/Shapes/AABB";
import { MBPhysicsGroups } from "../MBPhysicsGroups";

export default abstract class Entity {
    protected sprite: MBAnimatedSprite;
    protected emitter: Emitter;
    protected consumed: boolean = false;
    protected _isSnorlax: boolean = false;
    

    constructor(sprite: MBAnimatedSprite) {
        this.sprite = sprite;
        this.emitter = new Emitter();
        
    }

    /** Called when the player overlaps this entity */
    public abstract onPlayerContact(): void;

    /** Whether this entity disappears after being used */
    public get isConsumed(): boolean { return this.consumed; }

    public get isSnorlax(): boolean { return this._isSnorlax;}
    // public set isSnorlax(tf : boolean): { this._isSnorlax =tf; }

    public get position(): Vec2 { return this.sprite.position; }
    public update(deltaT: number): void { /* override in subclasses */ }
    protected destroy(): void {
        this.consumed = true;
        this.sprite.visible = false;
        this.sprite.setGroup(""); 
        
    }
}