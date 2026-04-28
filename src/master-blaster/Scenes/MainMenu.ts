import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import { GameEventType } from "../../Wolfie2D/Events/GameEventType";
import Button from "../../Wolfie2D/Nodes/UIElements/Button";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import Input from "../../Wolfie2D/Input/Input";      
import { MBControls } from "../MBControls";   
import ForestLevel from "./ForestLevel";
import Level1 from "./MBLevel1";
import WinterLevel from "./WinterLevel";


// Layers for the main menu scene
export const MenuLayers = {
    MAIN: "MAIN",
    BACKGROUND: "BACKGROUND",
    BUTTONS: "BUTTONS"
} as const;

export default class MainMenu extends Scene {

    public static readonly START_SCREEN_KEY = "StartScreen";
    public static readonly START_SCREEN_PATH = "game_assets/spritesheets/STARTSCREEN.json"

    public static readonly MUSIC_KEY = "MAIN_MENU_MUSIC";
    public static readonly MUSIC_PATH = "game_assets/music/traverse_loop.mp3";

    public static readonly SELECT_AUDIO_KEY = "SELECT_AUDIO_KEY"
    public static readonly SELECT_AUDIO_PATH = "game_assets/sounds/pickup.mp3"

    protected selectAudioKey!: string;
    private canStart: boolean = false;  // guard against instant re-trigger on scene load
    

    public loadScene(): void {
        this.load.audio(MainMenu.MUSIC_KEY, MainMenu.MUSIC_PATH);
        this.load.spritesheet(MainMenu.START_SCREEN_KEY, MainMenu.START_SCREEN_PATH);
        this.load.audio(MainMenu.SELECT_AUDIO_KEY, MainMenu.SELECT_AUDIO_PATH);
    }

    public startScene(): void {
        this.addUILayer(MenuLayers.MAIN);
        this.addLayer(MenuLayers.BACKGROUND);

        this.selectAudioKey = MainMenu.SELECT_AUDIO_KEY;
        this.viewport.setSize(320,240);

        // Reset bounds to canvas size so setFocus isn't clamped by a previous level's bounds
        this.viewport.setBounds(0, 0, 1200, 800);
        this.viewport.setFocus(new Vec2(600, 400));
        const size = new Vec2(600, 400); 
        let startscreen = this.add.animatedSprite(MainMenu.START_SCREEN_KEY, MenuLayers.BACKGROUND);
        startscreen.position.set(size.x, size.y);
        startscreen.animation.playIfNotAlready("DEFAULT");

        let playBtn = <Button>this.add.uiElement(UIElementType.BUTTON, MenuLayers.MAIN, {
            position: new Vec2(size.x, size.y + 40), text: ""
        });
        playBtn.backgroundColor = Color.TRANSPARENT;
        playBtn.borderColor = Color.TRANSPARENT;
        playBtn.borderRadius = 0;
        playBtn.setPadding(new Vec2(80, 10));
        playBtn.font = "PixelSimple";
        playBtn.onClick = () => this.startGame();

        this.emitter.fireEvent(GameEventType.PLAY_SOUND, { key: MainMenu.MUSIC_KEY, loop: true, holdReference: true });

        // ← Brief delay before accepting enter, so escape-to-quit doesn't immediately re-trigger
        setTimeout(() => { this.canStart = true; }, 300);
    }

    public updateScene(deltaT: number): void {
        if (this.canStart && Input.isJustPressed(MBControls.CONFIRM)) {
            this.startGame();
        }
    }

    private startGame(): void {
        this.emitter.fireEvent(GameEventType.PLAY_SOUND, { key: MainMenu.SELECT_AUDIO_KEY });
        this.sceneManager.changeToScene(WinterLevel);
    }

    public unloadScene(): void {
        this.load.keepAudio(this.selectAudioKey);
        this.emitter.fireEvent(GameEventType.STOP_SOUND, { key: MainMenu.MUSIC_KEY });
    }
}

