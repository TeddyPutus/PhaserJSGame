import './style.css'
import Phaser from "phaser";
import levelData from './levelData.json'; //this contains the map, and co-ordinate data about enemies
import GameScene from './game';
import MenuScene from './menu';
import LevelEditorScene from './levelEditor';
import LevelSelectScene from './levelSelector';

const game = new Phaser.Game({
  type: Phaser.AUTO, //This will automatically choose how to render the game on screen - other options are CANVAS or WEBGL
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
        gravity: { y: 300 },
        debug: true
    }
  },
  scene : [  MenuScene, LevelEditorScene, LevelSelectScene, GameScene ]
}) 

export default game;