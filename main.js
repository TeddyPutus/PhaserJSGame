import './style.css'
import Phaser from "phaser";
import levelData from './levelData.json'; //this contains the map, and co-ordinate data about enemies

const game = new Phaser.Game({
  type: Phaser.AUTO, //This will automatically choose how to render the game on screen - other options are CANVAS or WEBGL
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
        gravity: { y: 300 },
        debug: false
    }
  },
  scene : {
    preload: preload,
    create:create,
    update:update
  }
})

function preload(){ //sprite loading, any other prep pre-game

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

  this.load.spritesheet('player', 'assets/dude.png',  { //80, 111 for robot
    frameWidth: 32,
    frameHeight: 48
    }); //image is split into series of frames

  this.load.spritesheet('enemy', 'assets/robot-sprite.png',  {
    frameWidth: 80,
    frameHeight: 111
    }); //image is split into series of frames
}

let player, cursors, scoreText, gameOverText, enemy, controlConfig, controls, cloudsWhite, cloudsWhiteSmall, bombs, stars, layer;
let score = 0, bombOrStarDelay = 4000, bombOrStarIterations = 0, livesLeft = 3, gameOverBool = false;

//array of objects
/**
 * {enemyObject: enemy, startX:int, endX: int} 
 */
let enemies = [];


function create(){ //pre-game loop set up

  //Load the background
  this.add.tileSprite(400, 300, 10240, 800, 'sky');
  cloudsWhite = this.add.tileSprite(640, 200, 10240, 400, "clouds-white");
  cloudsWhiteSmall = this.add.tileSprite(640, 200, 10240, 400, "clouds-white-small");

  // When loading from an array, make sure to specify the tileWidth and tileHeight
  let map = this.make.tilemap({ data: levelData[0].levelMap, tileWidth: 16, tileHeight: 16 });
  let tiles = map.addTilesetImage('tiles', 'tiles');
  layer = map.createLayer(0, tiles, 0, 0);

  //make the ground solid
  layer.setCollision(1);

  //load enemy data from json file
  loadEnemies(this);

  //the callback will randomly create a bomb or star in the vicinity of the player, intervals will decrease as time goes on
  let bombOrStar = this.time.addEvent({ delay: bombOrStarDelay, callback: generateBombOrStar, callbackScope: this, loop: true });

  //create empty groups for bombs and stars, create the physics 
  //These groups will be added to by our timed event
  bombs = this.physics.add.group();
  stars = this.physics.add.group();

  this.physics.add.collider(bombs, layer);
  this.physics.add.collider(stars, layer);

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

  //setting the scroll factor to 0 makes it track the camera
  scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });
  scoreText.setScrollFactor(0);

  gameOverText = this.add.text(300, 200, '', { fontSize: '32px', fill: '#000' })
  gameOverText.setScrollFactor(0);

  //Listen for keyboard inputs
  cursors = this.input.keyboard.createCursorKeys();
  
  //Set the world bounds to equal the size of our tilemap - this menas if change the tilemap, the world bounds will update
  this.physics.world.setBounds(0, 0, layer.width, layer.height)
  this.cameras.main.setBounds(0, 0, layer.x + layer.width, 0);

  //create our player last, as the function creates collisions, camera movements etc.
  loadPlayer(this);
  
}

function update(){

  cloudsWhite.tilePositionX += 0.5;
  cloudsWhiteSmall.tilePositionX += 0.25;

  if (cursors.left.isDown){
        player.setVelocityX(-160);
        player.anims.play('left', true);
    }else if (cursors.right.isDown){
      player.setVelocityX(160);
      player.anims.play('right', true);
    }else{
      player.setVelocityX(0);
      player.anims.play('turn');
  }

  if (cursors.up.isDown && player.body.onFloor())//.touching.down
  { 
    player.setVelocityY(-330);
  }

  //cycle through enemy objects, set their direction if needed
  setEnemyDirection();
}

//function to generate random bomb or star at decreasing intervals 
//Set up as a looping callback in create()
function generateBombOrStar(){
  if(gameOverBool) return;

  let bombOrStar, object, xValue, yValue; //randomly determined in the loop, xValue is the co-ordinate we drop the object
  let numOfItems = randomIntBetweenLimits(1, 5)// This is how many we will drop

  //create items
  for(let i = 0; i < numOfItems; i ++){
    bombOrStar = randomIntBetweenLimits(1, 2); //1 = bomb, 2 = star
    xValue = randomIntBetweenLimits(player.body.x - 250, player.body.x + 250)
    yValue = randomIntBetweenLimits(0, layer.height)
    if(bombOrStar === 1){ //make bombs
      object = bombs.create(xValue, yValue, 'bomb');
    } else{ //make stars
      object = stars.create(xValue, yValue, "star");
    }
    object.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8)); //set a random bounce for each object
  }

  bombOrStarIterations++;
  if(bombOrStarIterations === 5){ //decrease interval until we're creating objects every second
    bombOrStarIterations = 0;
    if(bombOrStarDelay > 1000){
      bombOrStarDelay -= 100;
    }
  }
}

//function to return a random number between min and max
function randomIntBetweenLimits(min, max){
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function loadEnemies(game){
  for(let newEnemy of levelData[0].enemies){
    enemy = game.physics.add.sprite(newEnemy.startX, newEnemy.startY, 'enemy');
    enemies.push({enemyObject: enemy, startX: newEnemy.startX, endX: newEnemy.endX});
    game.physics.add.collider(enemy, layer); //this stops sprite from falling through the floor
  }
}

function loadPlayer(game){
  player = game.physics.add.sprite(100, 450, 'player'); //place at start of level
  player.setBounce(0.2); //how much they bounce when hitting ground
  player.body.setGravityY(10); //how much gravity affects them (the lower, the higher they jump)
  player.setCollideWorldBounds(true) //Set to true if you don't want them to go off screen
  game.physics.add.collider(player, layer); //this stops sprite from falling through the floor
  game.physics.add.collider(player, bombs, (player, bomb) => {game.physics.pause(); gameOver(player, game); gameOverText.setText('Game Over');}, null, game);
    
  game.physics.add.overlap(player, stars, (player, star) => {collectStar(player, star)}, null, this);
    
  for(let enemy of enemies){ //enemies is an array, so is accessed with a for loop
    game.physics.add.collider(player, enemy.enemyObject, (player, enemy) => {
      if(hitFromTop(player, enemy)) destroyEnemy(enemy);
      else {
          gameOver(player, game);
          gameOverText.setText('Game Over'); 
          game.physics.pause();
        }
      }, null, game);
  }

  
   game.cameras.main.startFollow(player);
}

//function to check on each enemy 
//if they have reached their turn around co-ordinates, flip sprite and direction
function setEnemyDirection(){
  for(let enemy of enemies){
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
function collectStar (player, star)
{
    star.disableBody(true, true);
    score += 10;
    scoreText.setText('Score: ' + score);
}

//Function to handle hitting a bomb, enemy or running out of time
function gameOver (player, game)
{
    player.setTint(0xff0000);
    player.anims.play('turn');
    gameOverBool = true;
    livesLeft--;
    if(livesLeft){
      game.time.addEvent({ delay: 1000, callback: resetGame, callbackScope: game, loop: false });
    }
}

//reset game state to start
//remove all sprites, add them in start positions
//remove all bombs and stars
//remove game over text
function resetGame(){
  player.disableBody(true, true);
  for(let enemy of enemies){ //enemies is an array, so is accessed with a for loop
    enemy.enemyObject.disableBody(true, true);
  }
  bombs.children.iterate(function (bomb){
    bomb.disableBody(true, true);
  });
  stars.children.iterate(function (star){
    star.disableBody(true, true);
  });
  gameOverText.destroy();

  //resume game physics
  this.physics.resume();

  //reload enemies
  loadEnemies(this);

  //reload player
  loadPlayer(this);

  //set gameOverBool to false
  gameOverBool = false;

  
}

//on collision with enemy, check if we have hit the top or the side
function hitFromTop(player, object){
  return ((player.body.y + player.body.height) <= object.y) &&
          (player.body.x - object.x > 10 || object.x + object.width - player.body.x >10);
  }

  //Function destroy enemy if we have hit it from the top
function destroyEnemy(enemy){
  enemy.disableBody(true, true);
  score += 50;
  scoreText.setText('Score: ' + score);
}

//this stuff is needed for a level creatore panning effect
  // controlConfig = {
  //     camera: this.cameras.main,
  //     left: cursors.left,
  //     right: cursors.right,
  //     speed: 0.5
  // };

  // controls = new Phaser.Cameras.Controls.FixedKeyControl(controlConfig);