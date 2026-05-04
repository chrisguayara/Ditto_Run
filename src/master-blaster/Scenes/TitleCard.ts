import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import { GameEventType } from "../../Wolfie2D/Events/GameEventType";
import Button from "../../Wolfie2D/Nodes/UIElements/Button";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import Input from "../../Wolfie2D/Input/Input";
import { MBControls } from "../MBControls";
import { MenuAssets } from "./MenuAssets";
import MainMenu from "./MainMenu";

export default class TitleCard extends Scene {

    public static readonly MUSIC_KEY         = MenuAssets.MUSIC_KEY;
    public static readonly MUSIC_PATH        = MenuAssets.MUSIC_PATH;
    public static readonly START_SCREEN_KEY  = MenuAssets.START_SCREEN_KEY;
    public static readonly START_SCREEN_PATH = MenuAssets.START_SCREEN_PATH;
    public static readonly SELECT_AUDIO_KEY  = MenuAssets.SELECT_AUDIO_KEY;
    public static readonly SELECT_AUDIO_PATH = MenuAssets.SELECT_AUDIO_PATH;

    private canStart: boolean = false;

    public loadScene(): void {
        this.load.audio(MenuAssets.MUSIC_KEY, MenuAssets.MUSIC_PATH);
        this.load.spritesheet(MenuAssets.START_SCREEN_KEY, MenuAssets.START_SCREEN_PATH);
        this.load.audio(MenuAssets.SELECT_AUDIO_KEY, MenuAssets.SELECT_AUDIO_PATH);
    }

    public startScene(): void {
        this.addLayer("BACKGROUND");
        this.addUILayer("MAIN");

        this.viewport.setSize(320, 240);
        this.viewport.setBounds(0, 0, 1200, 800);
        this.viewport.setFocus(new Vec2(600, 400));

        const bg = this.add.animatedSprite(MenuAssets.START_SCREEN_KEY, "BACKGROUND");
        bg.position.set(600, 400);
        bg.animation.playIfNotAlready("DEFAULT", true);

        const playBtn = <Button>this.add.uiElement(UIElementType.BUTTON, "MAIN", {
            position: new Vec2(600, 440),
            text: ""
        });
        playBtn.backgroundColor = Color.TRANSPARENT;
        playBtn.borderColor     = Color.TRANSPARENT;
        playBtn.borderRadius    = 0;
        playBtn.setPadding(new Vec2(600, 400)); // covers whole screen
        playBtn.onClick = () => this.proceed();

        this.emitter.fireEvent(GameEventType.PLAY_SOUND, {
            key: MenuAssets.MUSIC_KEY,
            loop: true,
            holdReference: true,
        });

        setTimeout(() => { this.canStart = true; }, 300);
    }

    public updateScene(_deltaT: number): void {
        if (!this.canStart) return;
        if (Input.isJustPressed(MBControls.CONFIRM)) {
            this.proceed();
        }
    }

    private proceed(): void {
        this.emitter.fireEvent(GameEventType.PLAY_SOUND, { key: MenuAssets.SELECT_AUDIO_KEY });
        this.load.keepAudio(MenuAssets.MUSIC_KEY);
        this.load.keepAudio(MenuAssets.SELECT_AUDIO_KEY);
        this.load.keepSpritesheet(MenuAssets.START_SCREEN_KEY); // keep bg alive for MainMenu
        this.sceneManager.changeToScene(MainMenu);
    }

    public unloadScene(): void {}
}