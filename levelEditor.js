import './style.css'
import Phaser from "phaser";
import game from './main';
import defaultLevelData from './levelData.json'; //this contains the map, and co-ordinate data about enemies

class LevelEditorScene extends Phaser.Scene {

    constructor () {
        super('LevelEditorScene');
        this.menuTitle;

        //we need these to store map data we will eventually save to json
        this.enemies = [];
        this.enemy;
        // this.map, this.tiles, this.layer; //data to hold the tilemap and show it on screen
        this.layer;

        this.controlConfig, this.controls, this.cursors;
        this.tileBtn, this.playBtn, this.enemyBtn;
        this.sky, this.themeMusic, this.cloudsWhite, this.cloudsWhiteSmall;
        
        this.placeTile = false, this.placeEnemy = false;
    }

    preload(){ //sprite loading, any other prep pre-game

        this.load.image('sky', 'assets/sky.png');
        this.load.image('star', 'assets/star.png');
      
        this.load.image("clouds-white", "assets/clouds-white.png");
        this.load.image("clouds-white-small", "assets/clouds-white-small.png");

        this.load.image("tileBtn", "assets/placeTileBtn.png");
        this.load.image("enemyBtn", "assets/placeEnemyBtn.png");
        this.load.image("playBtn", 'assets/playLvlBtn.png');
     
        //load music and sound effects
        this.load.audio("theme", ["assets/theme.mp3"]);

        //load the tile data
        this.load.image('tiles', 'assets/tileset.png');
      } 
      
      create(){ //pre-game loop set up
        //initialise empty map - it is a massive array, we'll do it with nested for loops
        let levelData = []; //defaultLevelData[0].levelMap;
        for(let i = 0; i<= 37; i++){
            let row = [];
            for(let x = 0; x <=206 ; x++){
                row.push(-1);
            }
            levelData.push(row);
        }
      
        //Load the background
        this.sky = this.add.tileSprite(400, 300, 10240, 800, 'sky');
        this.cloudsWhite = this.add.tileSprite(640, 200, 10240, 400, "clouds-white");
        this.cloudsWhiteSmall = this.add.tileSprite(640, 200, 10240, 400, "clouds-white-small");

        this.themeMusic = this.sound.add("theme", { loop: true, seek: 0 });
        // this.themeMusic.play();


        this.map = this.make.tilemap({ data: levelData, tileWidth: 16, tileHeight: 16 });
        this.tiles = this.map.addTilesetImage('tiles', 'tiles');
        this.layer = this.map.createLayer(0, this.tiles, 0, 0);

        

        //test to see if we can get useful tile data on click
        this.input.on('pointerup', (pointer) => {
            let tile = this.map.getTileAtWorldXY(pointer.worldX, pointer.worldY, true);
            tile.index = tile.index === -1? 1 : -1; //toggle between platform and not platform
            console.log(pointer.worldX, pointer.worldY, tile);
            console.log(this.layer.layer.data) //this contains map data as array of tile objects - we are only concerned with the .index of each element!
          }, this);


        this.tileBtn = this.add.image(100, 25, 'tileBtn');
        this.playBtn = this.add.image(400, 25, 'playBtn');
        this.enemyBtn = this.add.image(700, 25, 'enemyBtn');
        this.tileBtn.setInteractive();
        this.playBtn.setInteractive();
        this.enemyBtn.setInteractive();
        this.tileBtn.setScrollFactor(0);
        this.playBtn.setScrollFactor(0);
        this.enemyBtn.setScrollFactor(0);

        // this.startBtn.setInteractive();
        // this.startBtn.on('pointerdown', () => {
        //     this.themeMusic.pause();
        //     console.log("Clicked")
        //     game.scene.start('GameScene');
    
        // });

        // this.levelEditorBtn.setInteractive();
        // this.levelEditorBtn.on('pointerdown', () => {
        //     this.themeMusic.pause();
        //     console.log("Clicked")
        //     game.scene.start('LevelEditorScene'); //not yet implemented!
    
        // });

        //lets the user move the camera with the cursor keys, it is not locked to a particular sprite or object
        this.cursors = this.input.keyboard.createCursorKeys();
        this.controlConfig = {
            camera: this.cameras.main,
            left: this.cursors.left,
            right: this.cursors.right,
            speed: 0.5
        };

        this.controls = new Phaser.Cameras.Controls.FixedKeyControl(this.controlConfig);
        //Set the world bounds to equal the size of our tilemap - this menas if change the tilemap, the world bounds will update
        // this.physics.world.setBounds(0, 0, 3312, this.layer.height)
        this.cameras.main.setBounds(0, 0, this.layer.width, 0);
        
      }
      
      update(delta){
      
        this.cloudsWhite.tilePositionX += 0.5;
        this.cloudsWhiteSmall.tilePositionX += 0.25;
        this.controls.update(delta * 0.0025); //needs a stupidly small number to slow down scrolling, otherwise it will scroll straight to the end

      }
      
    
}

export default LevelEditorScene;