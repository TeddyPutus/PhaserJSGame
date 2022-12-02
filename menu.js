import './style.css'
import Phaser from "phaser";
import game from './main';
import levelData from './levelData.json'; //this contains the map, and co-ordinate data about enemies

class MenuScene extends Phaser.Scene {

    constructor () {
        super('MenuScene');
        this.menuTitle;
        this.startBtn;
        this.levelEditorBtn;
    }

    preload(){ //sprite loading, any other prep pre-game

        this.load.image('sky', 'assets/sky.png');
        this.load.image('star', 'assets/star.png');
        this.load.image('platform', 'assets/platform.png');
        this.load.image('bomb', 'assets/bomb.png');
      
        this.load.image("clouds-white", "assets/clouds-white.png");
        this.load.image("clouds-white-small", "assets/clouds-white-small.png");
        this.load.image("logo", "assets/Jump-Boi.png");

        this.load.image("startGameBtn", "assets/Start.png");
        this.load.image("levelEditorBtn", "assets/Creator.png");
     
        //load music and sound effects
        this.load.audio("theme", ["assets/theme.mp3"]);
      } 
      
      create(){ //pre-game loop set up
      
        //Load the background
        this.add.tileSprite(400, 300, 10240, 800, 'sky');
        this.cloudsWhite = this.add.tileSprite(640, 200, 10240, 400, "clouds-white");
        this.cloudsWhiteSmall = this.add.tileSprite(640, 200, 10240, 400, "clouds-white-small");

        this.themeMusic = this.sound.add("theme", { loop: true, seek: 0 });
        this.themeMusic.play();

        // this.menuTitle = this.add.text(300, 200, 'Main Menu', { fontSize: '32px', fill: '#000' })
        this.add.image(400, 200, 'logo')

        this.startBtn = this.add.image(560, 400, 'startGameBtn');
        this.levelEditorBtn = this.add.image(300, 400, 'levelEditorBtn');

        this.startBtn.setInteractive();
        this.startBtn.on('pointerdown', () => {
            this.themeMusic.pause();
            console.log("Clicked")
            // game.scene.start('GameScene', {level: false});
            game.scene.start('LevelSelectScene');
            game.scene.stop('MenuScene');
    
        });

        this.levelEditorBtn.setInteractive();
        this.levelEditorBtn.on('pointerdown', () => {
            this.themeMusic.pause();
            console.log("Clicked")
            game.scene.start('LevelEditorScene');
            game.scene.stop('MenuScene');
    
        });

      }
      
      update(){
      
        this.cloudsWhite.tilePositionX += 0.5;
        this.cloudsWhiteSmall.tilePositionX += 0.25;
      
        
      }
      
    
}

export default MenuScene;