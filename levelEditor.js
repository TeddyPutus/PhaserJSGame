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
        this.enemy = {};
        // this.map, this.tiles, this.layer; //data to hold the tilemap and show it on screen
        this.layer;

        this.controlConfig, this.controls, this.cursors;
        this.tileBtn, this.playBtn, this.enemyBtn;
        this.sky, this.themeMusic, this.cloudsWhite, this.cloudsWhiteSmall;
        
        this.placeTile = false, this.placeEnemy = false, this.placeEnemyEndPoint = false;
        this.text;
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

        // this.load.image('enemy', 'assets/robot-sprite.png');
        this.load.spritesheet('enemy', 'assets/robot-sprite.png',  {
            frameWidth: 80,
            frameHeight: 111
            }); //image is split into series of frames
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
        this.input.on('pointerdown', (pointer) => {
            if(pointer.worldY >= 99){
                let tile = this.map.getTileAtWorldXY(pointer.worldX, pointer.worldY, true);
                if(this.placeTile){
                    tile.index = tile.index === -1? 1 : -1; //toggle between platform and not platform
                    console.log(this.layer.layer.data) //this contains map data as array of tile objects - we are only concerned with the .index of each element!
                }else if(this.placeEnemy){
                    this.configEnemy(pointer);//this is more complicated as there is an additional end checkpoint we want to add
                }else if(this.placeEnemyEndPoint){ //we have placed an enemy, but not given the end point for their patrol
                    this.configEnemyEndpoint(pointer);
                }
            }
            
            
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

        //toggle what we are placing
        this.tileBtn.on('pointerdown', () => {
            if(!this.placeEnemyEndPoint){
                this.placeTile = true;
                this.placeEnemy = false; 
            }
        });

        this.enemyBtn.on('pointerdown', () => {
            if(!this.placeEnemyEndPoint){
                this.placeEnemy = true;
                this.placeTile = false;
            } 
        });

        this.playBtn.on('pointerdown', () => {
            // this.themeMusic.pause();
            let levelData = []; //defaultLevelData[0].levelMap;
            for(let i = 0; i<= 37; i++){
                let row = [];
                for(let x = 0; x <=206 ; x++){
                    row.push(this.layer.layer.data[i][x].index);
                }
                levelData.push(row);
            }

            game.scene.start('GameScene', {level : {
                //need to filter the layer data, we want an array that contains .index of each element
                levelMap : levelData, enemies: this.enemies
            }});
            game.scene.stop('LevelEditorScene');
    
        });

        this.text = this.add.text(250, 300, ' ', { fontSize: '32px', fill: '#000' });
        this.text.setScrollFactor(0);

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
        this.text.setText(this.placeEnemyEndPoint ? "Select Endpoint" : " ");

      }
      
      configEnemy(pointer){
        //disable adding another new enemy, because we want to specify the endpoint first
        this.placeEnemy = false;
        this.placeEnemyEndPoint = true;
        let newEnemy = this.add.image(pointer.worldX, pointer.worldY, 'enemy');
        newEnemy.setInteractive();
        newEnemy.on('pointerdown', () => {
            //this filter function will remove the enemy from our enemies array
            this.enemies = this.enemies.filter(function (element){
                return element.startX != newEnemy.x;
            })
            newEnemy.destroy();
        });

        //store the startX and startY
        this.enemy.startX = pointer.worldX;
        this.enemy.startY = pointer.worldY;
      }

      configEnemyEndpoint(pointer){
        this.enemy.endX = pointer.worldX;

        //because of the way our enemy movement works, we want to make endX smaller than startX, swap if needed
        if(this.enemy.endX > this.enemy.startX){
            let tempValue = this.enemy.startX;
            this.enemy.startX = this.enemy.endX;
            this.enemy.endX = tempValue;
        }
        
        this.enemies.push(this.enemy);
        this.enemy = {};

        this.placeEnemy = true;
        this.placeEnemyEndPoint = false;

        console.log(this.enemies)
      }
    
}

export default LevelEditorScene;