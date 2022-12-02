import './style.css'
import Phaser from "phaser";
import game from './main';
import defaultLevelData from './levelData.json'; //this contains the map, and co-ordinate data about enemies
//This comment will test if our branch switching works
class LevelEditorScene extends Phaser.Scene {

    constructor () {
        super('LevelEditorScene');
        this.menuTitle;

        //this can be increased or decreased here as needed, until a drag function is implemented, it is very time consuming to make the map
        this.mapSize = 75;

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
        this.load.image("playBtn", 'assets/floppy.png');
        this.load.image("resetBtn", 'assets/reset.png');
     
        //load music and sound effects
        this.load.audio("theme", ["assets/theme.mp3"]);

        //load the tile data
        this.load.image('tiles', 'assets/tileset.png');

        // this.load.image('enemy', 'assets/robot-sprite.png');
        this.load.spritesheet('enemy', 'assets/robot-sprite.png',  {
            frameWidth: 80,
            frameHeight: 111
            }); //image is split into series of frames

        //swiping is done via plugin    
        this.load.scenePlugin({
            key: 'rexgesturesplugin',
            url: 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexgesturesplugin.min.js',
            sceneKey: 'rexGestures'
        });   
      } 
      
      create(){ //pre-game loop set up
        //initialise empty map - it is a massive array, we'll do it with nested for loops
        let levelData = []; //defaultLevelData[0].levelMap;
        for(let i = 0; i<= 37; i++){
            let row = [];
            for(let x = 0; x <= this.mapSize ; x++){
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

        
        //detect a swipe so it is easier to make platforms
        this.swipeInput = this.rexGestures.add.swipe({ velocityThreshold: 500 })
        .on('swipe', function (swipe) {
            console.log(swipe)
            if(swipe.lastPointer.downY  >= 99 && this.placeTile){
                for(let i = swipe.lastPointer.worldX; i <= swipe.lastPointer.worldX + swipe.lastPointer.upX; i+=16){
                    let tile = this.map.getTileAtWorldXY(i, swipe.lastPointer.downY, true);
                    if(tile !== null)tile.index = 1; //tile.index === -1? 1 : -1; //toggle between platform and not platform    
                }         
            }


        }, this);
        

        this.input.on('pointerdown', (pointer) => {
            if(pointer.worldY >= 99){
                let tile = this.map.getTileAtWorldXY(pointer.worldX, pointer.worldY, true);
                if(this.placeTile){
                    tile.index = tile.index === -1? 1 : -1; //toggle between platform and not platform
                }else if(this.placeEnemy){
                    this.configEnemy(pointer);//this is more complicated as there is an additional end checkpoint we want to add
                }else if(this.placeEnemyEndPoint){ //we have placed an enemy, but not given the end point for their patrol
                    this.configEnemyEndpoint(pointer);
                }
            }
            
            
          }, this);

        //place buttons, scale where needed
        this.tileBtn = this.add.image(100, 25, 'tileBtn');
        this.playBtn = this.add.image(750, 25, 'playBtn');
        this.playBtn.setScale(0.05);
        this.resetBtn = this.add.image(600, 25, 'resetBtn');
        this.resetBtn.setScale(0.08);
        this.enemyBtn = this.add.image(400, 25, 'enemyBtn');
        //make buttons clickable
        this.tileBtn.setInteractive();
        this.playBtn.setInteractive();
        this.resetBtn.setInteractive();
        this.enemyBtn.setInteractive();
        //lock buttons to camera
        this.tileBtn.setScrollFactor(0);
        this.resetBtn.setScrollFactor(0);
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

        //reset the tilemap data when reset button clicked
        this.resetBtn.on('pointerdown', () => {
            this.resetMap();
        });

        //When we click the save button, upload the file and go to main menus
        this.playBtn.on('pointerdown', async () => {
            // this.themeMusic.pause();
            let levelData = []; //defaultLevelData[0].levelMap;
            for(let i = 0; i<= 37; i++){
                let row = [];
                for(let x = 0; x <= this.mapSize ; x++){
                    row.push(this.layer.layer.data[i][x].index);
                }
                levelData.push(row);
            }
            
            await this.postLevelData(levelData, this.enemies);

            game.scene.start('MenuScene');
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

        //Enables reset of to main menu
        this.input.keyboard.on('keydown-' + 'R', () => {
            this.themeMusic.pause();
            game.scene.start('MenuScene');
            game.scene.stop('LevelEditorScene');
          });

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
    
      //method that posts the level data to the server
      async postLevelData(levelData, enemies){
        try {
            const response = await fetch("http://localhost:5001/levels",
                {
                    method:"POST",
                    mode:'cors', //very important for sending things in the body
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({"author" : "Teddy",
                    "levelData" : {"levelMap" : levelData, "enemies" : enemies}})
                }
            )
            const dataToReturn = await response.json();
            return dataToReturn;
        } catch (error) {
            return error;
        }
      }

      //method resets the map to empty
      resetMap(){
        for(let i = 0; i<= 37; i++){
            for(let x = 0; x <= this.mapSize ; x++){
                this.layer.layer.data[i][x].index = -1;
            }
        }
      }
}

export default LevelEditorScene;