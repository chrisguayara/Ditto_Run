import Entity from "../Entity";

export default abstract class Consumable extends Entity {

    protected consumed: boolean = false;

    public onPlayerContact(): void {
        if (!this.consumed) {
            console.log("Consumable touched"); // DEBUG

            this.consume();     // mark as consumed
            this.onConsume();   // apply effect
        }
    }

    protected consume(): void {
        this.consumed = true;

        // Disable collision + hide (RareCandy will override visuals)
        this.sprite.visible = false;
        this.sprite.setGroup("");
    }

    public abstract onConsume(): void;
}