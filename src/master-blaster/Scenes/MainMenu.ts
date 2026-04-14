import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import { GameEventType } from "../../Wolfie2D/Events/GameEventType";
import Button from "../../Wolfie2D/Nodes/UIElements/Button";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import ForestLevel from "./ForestLevel";
import Level1 from "./MBLevel1";


// Layers for the main menu scene
export const MenuLayers = {
    MAIN: "MAIN",
    BACKGROUND: "BACKGROUND"
} as const;

export default class MainMenu extends Scene {

    public static readonly START_SCREEN_KEY = "StartScreen";
    public static readonly START_SCREEN_PATH = "game_assets/spritesheets/STARTSCREEN.json"

    public static readonly MUSIC_KEY = "MAIN_MENU_MUSIC";
    public static readonly MUSIC_PATH = "game_assets/music/traverse_loop.mp3";

    public loadScene(): void {
        // Load the menu song
        this.load.audio(MainMenu.MUSIC_KEY, MainMenu.MUSIC_PATH);
        this.load.spritesheet(MainMenu.START_SCREEN_KEY, MainMenu.START_SCREEN_PATH);
        
    }

        public startScene(): void {
            this.addUILayer(MenuLayers.MAIN);
            this.addLayer(MenuLayers.BACKGROUND);
            

            this.viewport.setZoomLevel(1);
            let size = this.viewport.getHalfSize();
            this.viewport.setFocus(size);

            let startscreen = this.add.animatedSprite(MainMenu.START_SCREEN_KEY, MenuLayers.BACKGROUND);
            startscreen.position.set(size.x, size.y);
            startscreen.animation.play("DEFAULT");

            let playBtn = <Button>this.add.uiElement(UIElementType.BUTTON, MenuLayers.MAIN, {
                position: new Vec2(size.x, size.y+40), text: ""
            });
            playBtn.backgroundColor = Color.TRANSPARENT;
            playBtn.borderColor =  Color.TRANSPARENT;
            playBtn.borderRadius = 0;
            playBtn.setPadding(new Vec2(80, 10));
            playBtn.font = "PixelSimple";
            playBtn.onClick = () => { this.sceneManager.changeToScene(ForestLevel); }

            this.emitter.fireEvent(GameEventType.PLAY_SOUND, {key: MainMenu.MUSIC_KEY, loop: true, holdReference: true});
    }

    public unloadScene(): void {
        // The scene is being destroyed, so we can stop playing the song
        this.emitter.fireEvent(GameEventType.STOP_SOUND, {key: MainMenu.MUSIC_KEY});
    }
}

