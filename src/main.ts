import Game from "./Wolfie2D/Loop/Game";
import MainMenu from "./master-blaster/Scenes/MainMenu";
import { MBControls } from "./master-blaster/MBControls";
import TitleCard from "./master-blaster/Scenes/TitleCard";
import CastleLevel from "./master-blaster/Scenes/CastleLevel";
import WinterLevel from "./master-blaster/Scenes/WinterLevel";

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
            {name: MBControls.DOWN,         keys: ["s"]},
            {name: MBControls.ATTACK,       keys: ["x"]},
            {name: MBControls.TRANSFORM,    keys: ["e"]},
            {name: MBControls.CYCLE_FORM,   keys: ["f"]},
            {name: MBControls.ATTACK_LEFT,  keys: ["arrowleft"]},
            {name: MBControls.ATTACK_RIGHT, keys: ["arrowright"]},
            {name: MBControls.ATTACK_UP,    keys: ["arrowup"]},
            {name: MBControls.ATTACK_DOWN,  keys: ["arrowdown"]},
            {name: MBControls.PAUSE, keys: ["escape"]},
            {name: MBControls.CONFIRM,  keys: ["enter"]},
        ],
        useWebGL: false,                        // Tell the game we want to use webgl
        showDebug: false                       // Whether to show debug messages. You can change this to true if you want
    }
   document.addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Escape"].includes(e.key)) {
        e.preventDefault();
    }
}, { passive: false });
    // Create a game with the options specified
    const game = new Game(options);

    // Expose debugging functions to console
    (window as any).getPlayerPos = () => {
        const sceneManager = game.getSceneManager();
        const scene = (sceneManager as any).currentScene;
        if (scene && (scene as any).player) {
            const pos = (scene as any).player.position;
            console.log(`Player position: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)})`);
            return { x: pos.x, y: pos.y };
        } else {
            console.log("No active scene with player found");
            return null;
        }
    };

    (window as any).getPlayerInfo = () => {
        const sceneManager = game.getSceneManager();
        const scene = (sceneManager as any).currentScene;
        if (scene && (scene as any).player) {
            const player = (scene as any).player;
            const ctrl = player._ai;
            console.log("=== PLAYER INFO ===");
            console.log(`Position: (${player.position.x.toFixed(1)}, ${player.position.y.toFixed(1)})`);
            console.log(`Velocity: (${player.velocity.x.toFixed(1)}, ${player.velocity.y.toFixed(1)})`);
            console.log(`Health: ${ctrl.health}/${ctrl.maxHealth}`);
            console.log(`Energy: ${ctrl.transformations.energy.toFixed(1)}/${ctrl.transformations.maxEnergy}`);
            console.log(`Current Form: ${ctrl.transformations.activeForm?.displayName || 'Ditto'}`);
            console.log(`State: ${ctrl.currentState?.constructor.name || 'Unknown'}`);
            return {
                position: { x: player.position.x, y: player.position.y },
                velocity: { x: player.velocity.x, y: player.velocity.y },
                health: ctrl.health,
                maxHealth: ctrl.maxHealth,
                energy: ctrl.transformations.energy,
                maxEnergy: ctrl.transformations.maxEnergy,
                form: ctrl.transformations.activeForm?.displayName || 'Ditto',
                state: ctrl.currentState?.constructor.name || 'Unknown'
            };
        } else {
            console.log("No active scene with player found");
            return null;
        }
    };

    // Start our game
    game.start(TitleCard, {});
})();