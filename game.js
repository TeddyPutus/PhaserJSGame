import './style.css'
import Phaser from "phaser";
import game from './main';
import levelData from './levelData.json'; //this contains the map, and co-ordinate data about enemies

class GameScene extends Phaser.Scene {

    constructor () {
        super('GameScene');
        this.player, this.cursors, this.scoreText, this.gameOverText, this.livesLeftText, this.enemy, this.controlConfig, this.controls, this.cloudsWhite, this.cloudsWhiteSmall, this.bombs, this.stars, this.layer;
        this.score = 0, this.bombOrStarDelay = 4000, this.bombOrStarIterations = 0, this.livesLeft = 3, this.gameOverBool = false;
        this.themeMusic, this.jumpSound, this.starSound, this.victoryMusic, this.deathSound, this.gameOverMusic;
        this.fireballQuantity = 0;
      
      //array of objects
      /**
       * {enemyObject: enemy, startX:int, endX: int} 
       */
      this.enemies = [];
    }

    init(data)
    {
        if(data.level !== false) this.levelData = data.level;
        else this.levelData = false;
    }

    preload(){ //sprite loading, any other prep pre-game

        // load the PNG tileset
        this.load.image('tiles', 'assets/tileset.png')
    
        // load the JSON tilemap
        this.load.tilemapTiledJSON('tilemap', 'assets/testTerrain.json')
      
        this.load.image('sky', 'assets/sky.png');
        this.load.image('star', 'assets/star.png');
        this.load.image('platform', 'assets/platform.png');
        this.load.image('bomb', 'assets/bomb.png');
      
        this.load.image("clouds-white", "assets/clouds-white.png");
        this.load.image("clouds-white-small", "assets/clouds-white-small.png");
      
        this.load.image("life", "assets/heart.png")
      
        this.load.spritesheet('player', 'assets/dude.png',  { //80, 111 for robot
          frameWidth: 32,
          frameHeight: 48
          }); //image is split into series of frames
      
        this.load.spritesheet('enemy', 'assets/robot-sprite.png',  {
          frameWidth: 80,
          frameHeight: 111
          }); //image is split into series of frames
      
        //load music and sound effects
        this.load.audio("theme", ["assets/theme.mp3"]);
        this.load.audio("victory", ["assets/victory.mp3"]);
        this.load.audio("jump", ["assets/jump.mp3"]);
        this.load.audio("star", ["assets/star.wav"]);
        this.load.audio("death", ["assets/died.wav"]);
        this.load.audio("gameOver", ["assets/gameOver.mp3"]);

        //massive amounts of fireball
        this.load.image('fire0', '/assets/Fireball/Effects_Fire_0_01.png');
        this.load.image('fire1', '/assets/Fireball/Effects_Fire_0_02.png');
        this.load.image('fire2', '/assets/Fireball/Effects_Fire_0_03.png');
        this.load.image('fire3', '/assets/Fireball/Effects_Fire_0_04.png');
        this.load.image('fire4', '/assets/Fireball/Effects_Fire_0_05.png');
      }
      
      
      
      
      create(){ //pre-game loop set up
      
        //Load the background
        this.add.tileSprite(400, 300, 10240, 800, 'sky');
        this.cloudsWhite = this.add.tileSprite(640, 200, 10240, 400, "clouds-white");
        this.cloudsWhiteSmall = this.add.tileSprite(640, 200, 10240, 400, "clouds-white-small");
      
        //load music and sound effects
        this.jumpSound  = this.sound.add("jump", { loop: false });
        this.jumpSound.allowMultiple = true;
        this.starSound  = this.sound.add("star", { loop: false });
        this.starSound.allowMultiple = true;
        this.deathSound  = this.sound.add("death", { loop: false });
        this.deathSound.allowMultiple = true;
        this.victoryMusic  = this.sound.add("victory", { loop: true, seek: 0 }); 
        this.themeMusic = this.sound.add("theme", { loop: true, seek: 0 });
        this.gameOverMusic = this.sound.add("gameOver", { loop: true, seek: 0 });
        this.themeMusic.play();
        this.victoryMusic.play();
        this.victoryMusic.pause();
        this.gameOverMusic.play();
        this.gameOverMusic.pause();
      
        // When loading from an array, make sure to specify the tileWidth and tileHeight
        this.map = this.make.tilemap({ data: this.levelData !== false ? this.levelData.levelMap : levelData[0].levelMap, tileWidth: 16, tileHeight: 16 });
        this.tiles = this.map.addTilesetImage('tiles', 'tiles');
        this.layer = this.map.createLayer(0, this.tiles, 0, 0);
      
        //make the ground solid
        this.layer.setCollision(1);
      
        //load enemy data from json file
        this.loadEnemies(this);
      
        //the callback will randomly create a bomb or star in the vicinity of the player, intervals will decrease as time goes on
        let bombOrStar = this.time.addEvent({ delay: this.bombOrStarDelay, callback: this.generateBombOrStar, callbackScope: this, loop: true });
      
        //create empty groups for bombs and stars, create the physics 
        //These groups will be added to by our timed event
        this.bombs = this.physics.add.group();
        this.stars = this.physics.add.group();
        this.fireballs = this.physics.add.group();
      
        this.physics.add.collider(this.bombs, this.layer);
        this.physics.add.collider(this.stars, this.layer);
      
        this.anims.create({
          key: 'left',
          frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
          frameRate: 10,
          repeat: -1
        });
      
        this.anims.create({
            key: 'turn',
            frames: [ { key: 'player', frame: 4 } ],
            frameRate: 10
        });
      
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('player', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });
      
        //enemy animations
        this.anims.create({
          key:'enemyLeft',
          frames: this.anims.generateFrameNumbers('enemy', { start: 10, end: 16 }),
          frameRate: 10,
          repeat: -1
        })
      
        this.anims.create({
          key:'enemyRight',
          frames: this.anims.generateFrameNumbers('enemy', { start: 10, end: 16 }),
          frameRate: 10,
          repeat: -1
        })
      
        this.anims.create({
          key: 'explosion',
          frames: [
              { key: 'fire0' },
              { key: 'fire1' },
              { key: 'fire2' },
              { key: 'fire3' },
              { key: 'fire4' }
          ],
          frameRate: 10,
          repeat: 1
      });

        //setting the scroll factor to 0 makes it track the camera
        this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });
        this.scoreText.setScrollFactor(0);
      
        this.gameOverText = this.add.text(300, 200, ' ', { fontSize: '32px', fill: '#000' })
        this.gameOverText.setScrollFactor(0);
      
        this.livesLeftText = this.add.text(300, 16, `Lives Left: ${this.livesLeft}`, { fontSize: '32px', fill: '#000' })
        this.livesLeftText.setScrollFactor(0);
      
        //Listen for keyboard inputs
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown-' + 'R', () => {
          this.themeMusic.pause();
          this.victoryMusic.pause();
          this.deathSound.pause();
          game.scene.start('MenuScene');
          game.scene.stop('GameScene');
        });

        this.input.keyboard.on('keydown-' + 'S', () => {
          console.log("shoot")
          this.createFireball();
        });

        
        //Set the world bounds to equal the size of our tilemap - this means if change the tilemap, the world bounds will update
        this.physics.world.setBounds(0, 0, this.layer.width, this.layer.height)
        this.cameras.main.setBounds(0, 0, this.layer.x + this.layer.width, 0);
      
        //create our player last, as the function creates collisions, camera movements etc.
        this.loadPlayer(this);
        
      }
      
      update(){
      
        this.cloudsWhite.tilePositionX += 0.5;
        this.cloudsWhiteSmall.tilePositionX += 0.25;
      
        if (this.cursors.left.isDown){
              if(this.player.x > 15) this.player.setVelocityX(-160);
              else this.player.setVelocityX(0);
              this.player.anims.play('left', true);
          }else if (this.cursors.right.isDown){
            this.player.setVelocityX(160);
            this.player.anims.play('right', true);
          }else{
            this.player.setVelocityX(0);
            this.player.anims.play('turn');
        }
      
        if (this.cursors.up.isDown && this.player.body.onFloor())//.touching.down
        { 
            this.player.setVelocityY(-330);
            this.jumpSound.play()
        }
      
        //cycle through enemy objects, set their direction if needed
        this.setEnemyDirection();
      
        //check win condition, if player is within 20px of end of map, pause physics and show YOU WIN!
        if(this.checkWin()){
            this.themeMusic.pause();
            this.gameOverText.setText("YOU WIN!!!");
            this.victoryMusic.resume()
            this.gameOverBool = true;
          this.physics.pause();
        }
      
        //check player has not fallen in a hole
        if(this.player.body.y > this.layer.height && this.gameOverBool===false){
          this.physics.pause();
          this.gameOver(this.player, this);
          this.gameOverText.setText(this.livesLeft > 0 ? ' ' : 'Game Over');  
        }
      
        if(this.livesLeft === 0){
            this.themeMusic.pause();
            this.gameOverMusic.resume();
            //this almost works as a return to main menu, it is still trying to execute something and throwing errors
            // this.time.addEvent({ delay: 5000, callback: () => {
            //                                                     this.gameOverMusic.pause();
            //                                                     game.scene.start('MenuScene');
            //                                                     game.scene.stop('GameScene');
            //                                                   }, callbackScope: game, loop: false });
        }
      
      }
      
      //function to generate random bomb or star at decreasing intervals 
      //Set up as a looping callback in create()
      generateBombOrStar(){
        if(this.gameOverBool) return;
      
        let bombOrStar, object, xValue, yValue; //randomly determined in the loop, xValue is the co-ordinate we drop the object
        let numOfItems = this.randomIntBetweenLimits(1, 5)// This is how many we will drop
      
        //create items
        for(let i = 0; i < numOfItems; i ++){
          bombOrStar = this.randomIntBetweenLimits(1, 2); //1 = bomb, 2 = star
          xValue = this.randomIntBetweenLimits(this.player.body.x - 250, this.player.body.x + 250)
          yValue = this.randomIntBetweenLimits(0, Math.floor(this.layer.height / 2))
          if(bombOrStar === 1){ //make bombs
            object = this.bombs.create(xValue, yValue, 'bomb');
          } else{ //make stars
            object = this.stars.create(xValue, yValue, "star");
          }
          object.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8)); //set a random bounce for each object
          object.setBounceX(Phaser.Math.FloatBetween(0.4, 0.8)); //set a random bounce for each object
          let leftOrRight = this.randomIntBetweenLimits(1, 2);
          object.setVelocityX(leftOrRight === 1 ? -1 * this.randomIntBetweenLimits(10, 50) : this.randomIntBetweenLimits(10, 50));
        }
      
        this.bombOrStarIterations++;
        if(this.bombOrStarIterations === 5){ //decrease interval until we're creating objects every second
            this.bombOrStarIterations = 0;
          if(this.bombOrStarDelay > 1000){
            this.bombOrStarDelay -= 100;
          }
        }
      }
      
      createFireball(){
        let fireball = this.fireballs.create(this.player.body.x, this. player.body.y, 'fire0')

        if(this.cursors.left.isDown) fireball.flipX = true;
        let xVelocity = this.cursors.left.isDown ? -100 : 100;

        fireball.anims.play('explosion', true);
        fireball.setScale(0.5);
        fireball.setGravityY(-300);
        fireball.setVelocityX(xVelocity);

        this.physics.add.overlap(fireball, this.bombs, (fireball, bomb) => {this.destroyBomb(fireball, bomb)}, null, this);

        for(let enemy of this.enemies){
          this.physics.add.overlap(fireball, enemy.enemyObject, (fireball, enemy) => {this.destroyBomb(fireball, enemy)}, null, this);
        }
        //destroy after some period of time, so the page isn't filled with fireballs
        this.time.addEvent({ delay: 2000, callback: () => {fireball.disableBody(true, true)}, callbackScope: this, loop: true });
      }

      destroyBomb(fireball, bomb){
        bomb.disableBody(true, true);
        fireball.disableBody(true, true)
        this.deathSound.play();
        this.score += 5;
        this.scoreText.setText('Score: ' + this.score);
      }

      //function to return a random number between min and max
      randomIntBetweenLimits(min, max){
        return Math.floor(Math.random() * (max - min + 1) + min);
      }
      
      loadEnemies(game){
        for(let newEnemy of this.levelData !== false ? this.levelData.enemies: levelData[0].enemies){
            this.enemy = game.physics.add.sprite(newEnemy.startX, newEnemy.startY, 'enemy');

            this.enemies.push({enemyObject: this.enemy, startX: newEnemy.startX, endX: newEnemy.endX});
            game.physics.add.collider(this.enemy, this.layer); //this stops sprite from falling through the floor
        }
      }
      
      loadPlayer(game){
        this.player = game.physics.add.sprite(100, 100, 'player'); //place at start of level
        this.player.setBounce(0.2); //how much they bounce when hitting ground
        this.player.body.setGravityY(10); //how much gravity affects them (the lower, the higher they jump)
        // player.setCollideWorldBounds(true) //Set to true if you don't want them to go off screen
        game.physics.add.collider(this.player, this.layer); //this stops sprite from falling through the floor
        game.physics.add.collider(this.player, this.bombs, (player, bomb) => {game.physics.pause(); this.gameOver(player, game); this.gameOverText.setText(this.livesLeft > 0 ? ' ' : 'Game Over');}, null, game);
          
        game.physics.add.overlap(this.player, this.stars, (player, star) => {this.collectStar(player, star)}, null, this);
          
        for(let enemy of this.enemies){ //enemies is an array, so is accessed with a for loop
          game.physics.add.collider(this.player, enemy.enemyObject, (player, enemy) => {
            if(this.hitFromTop(player, enemy)) this.destroyEnemy(enemy);
            else {
                this.gameOver(player, game);
                this.gameOverText.setText(this.livesLeft > 0 ? ' ' : 'Game Over'); 
                game.physics.pause();
                //
              }
            }, null, game);
        }
      
         game.cameras.main.startFollow(this.player);
      }
      
      checkWin(){
        if(this.layer.width - Math.floor(this.player.x) <= 20){
          return true;
        } else return false
      }
      
      //function to check on each enemy 
      //if they have reached their turn around co-ordinates, flip sprite and direction
      setEnemyDirection(){
        for(let enemy of this.enemies){
          if(Math.floor(enemy.enemyObject.x) === Math.floor(enemy.startX)){
            enemy.enemyObject.setVelocityX(-50);
            enemy.enemyObject.anims.play('enemyLeft', true);
            enemy.enemyObject.flipX = true;
          } else if(Math.floor(enemy.enemyObject.x) === Math.floor(enemy.endX)){
            enemy.enemyObject.setVelocityX(50);
            enemy.enemyObject.anims.play('enemyRight', true);
            enemy.enemyObject.flipX = false;
          }
        }
      }
      
      //Function handles point scoring of star
      collectStar (player, star)
      {
        this.starSound.play();
        star.disableBody(true, true);
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);
      }
      
      //Function to handle hitting a bomb, enemy or running out of time
      gameOver (player, game, delay=1000)
      {
          player.setTint(0xff0000);
          player.anims.play('turn');
          this.gameOverBool = true;
          this.deathSound.play();
          this.livesLeft--;
          this.livesLeftText.setText(`Lives Left: ${this.livesLeft}`);
          if(this.livesLeft){
            game.time.addEvent({ delay: delay, callback: this.resetGame, callbackScope: game, loop: false });
          }
      }
      
      //reset game state to start
      //remove all sprites, add them in start positions
      //remove all bombs and stars
      //remove game over text
      resetGame(){
        this.player.disableBody(true, true);
        for(let enemy of this.enemies){ //enemies is an array, so is accessed with a for loop
          enemy.enemyObject.disableBody(true, true);
        }
        this.bombs.children.iterate(function (bomb){
          bomb.disableBody(true, true);
        });
        this.stars.children.iterate(function (star){
          star.disableBody(true, true);
        });
        
        this.gameOverText.setText(' '); 
        
        //resume game physics
        this.physics.resume();
      
        //reload enemies
        this.loadEnemies(this);
      
        //reload player
        this.loadPlayer(this);
      
        //set gameOverBool to false
        this.gameOverBool = false;
      }
      
      //on collision with enemy, check if we have hit the top or the side
      hitFromTop(player, object){
        return ((player.body.y + player.body.height) <= object.y) &&
                (player.body.x - object.x > 10 || object.x + object.width - player.body.x >10);
        }
      
        //Function destroy enemy if we have hit it from the top
      destroyEnemy(enemy){
        this.starSound.play();
        enemy.disableBody(true, true);
        this.score += 50;
        this.scoreText.setText('Score: ' + this.score);
      }

}

export default GameScene;

//this is how you restart a scene allegedly
//this.scene.restart();