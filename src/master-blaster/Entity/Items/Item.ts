// src/mb/Entity/Items/Item.ts
import Entity from "../Entity";
import MBAnimatedSprite from "../../Nodes/MBAnimatedSprite";
import { MBEvents } from "../../MBEvents";

export default abstract class Item extends Entity {
    constructor(sprite: MBAnimatedSprite) {
        super(sprite);
    }

    public onPlayerContact(): void {
        if (this.consumed) return;
        this.applyEffect();
        this.destroy();
    }

    protected abstract applyEffect(): void;
}