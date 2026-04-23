import Game from "./Wolfie2D/Loop/Game";
import MainMenu from "./master-blaster/Scenes/MainMenu";
import { MBControls } from "./master-blaster/MBControls";

// The main function is your entrypoint into Wolfie2D. Specify your first scene and any options here.
(function main(){

    // Set up options for our game
    let options = {
        canvasSize: {x: 1200, y: 800},          // The size of the game
        clearColor: {r: 34, g: 32, b: 52},   // The color the game clears to
        inputs: [
            {name: MBControls.MOVE_LEFT,    keys: ["a"]},
            {name: MBControls.MOVE_RIGHT,   keys: ["d"]},
            {name: MBControls.JUMP,         keys: ["w", "space"]},
            {name: MBControls.ATTACK,       keys: ["x"]},
            {name: MBControls.TRANSFORM,    keys: ["e"]},
            {name: MBControls.CYCLE_FORM,   keys: ["f"]},
            {name: MBControls.ATTACK_LEFT,  keys: ["arrowleft"]},
            {name: MBControls.ATTACK_RIGHT, keys: ["arrowright"]},
            {name: MBControls.ATTACK_UP,    keys: ["arrowup"]},
            {name: MBControls.ATTACK_DOWN,  keys: ["arrowdown"]},
            {name: MBControls.PAUSE, keys: ["escape"]},
        ],
        useWebGL: false,                        // Tell the game we want to use webgl
        showDebug: false                       // Whether to show debug messages. You can change this to true if you want
    }
    window.addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight","Escape"].includes(e.key)) {
        e.preventDefault();
    }
    } , { passive: false });
    // Create a game with the options specified
    const game = new Game(options);

    // Start our game
    game.start(MainMenu, {});
})();