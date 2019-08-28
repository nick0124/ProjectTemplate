import "Phaser"
import { MainScene } from "./scenes/mainScene";

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: "game",
    width: 800,
    height: 600,
    scene: [MainScene]
};

export class Game extends Phaser.Game{
    constructor(config: Phaser.Types.Core.GameConfig) {
        super(config);
    }
}

window.addEventListener("load", () => {var game = new Game(config)});