import './style.css'
import Phaser from "phaser";
import game from './main';
import levelData from './levelData.json'; //this contains the map, and co-ordinate data about enemies

class LevelSelectScene extends Phaser.Scene {

    constructor () {
        super('LevelSelectScene');
        this.menuTitle;
        this.levelSelectedText;
        this.levelSelected = 1;
        this.startBtn;
        this.nextBtn;
        this.prevBtn;
        this.retrievedLevels;
    }


  preload(){ //sprite loading, any other prep pre-game

      this.load.image('sky', 'assets/sky.png');
      this.load.image('star', 'assets/star.png');
    
      this.load.image("clouds-white", "assets/clouds-white.png");
      this.load.image("clouds-white-small", "assets/clouds-white-small.png");
      this.load.image("logo", "assets/Jump-Boi.png");

      this.load.image("startGameBtn", "assets/startGameBtn.png");
      this.load.image("levelEditorBtn", "assets/levelEditorBtn.png");
      this.load.image("nextBtn", "assets/nextBtn.png");
   
      //load music and sound effects
      this.load.audio("theme", ["assets/theme.mp3"]);
    } 
    
    create(){ //pre-game loop set up

      //get data from database, then do everything else
      this.getData().then((data) => {
        this.retrievedLevels = data;
      }); 

       //Load the background
       this.add.tileSprite(400, 300, 10240, 800, 'sky');
       this.cloudsWhite = this.add.tileSprite(640, 200, 10240, 400, "clouds-white");
       this.cloudsWhiteSmall = this.add.tileSprite(640, 200, 10240, 400, "clouds-white-small");

       this.themeMusic = this.sound.add("theme", { loop: true, seek: 0 });
       this.themeMusic.play();

       this.menuTitle = this.add.text(280, 260, 'Level Select', { fontSize: '32px', fill: '#000' })
       this.add.image(400, 200, 'logo')

       this.levelSelectedText = this.add.text(400, 400, `${this.levelSelected}`, { fontSize: '32px', fill: '#000' })

       this.startBtn = this.add.image(400, 550, 'startGameBtn');
       this.startBtn.setInteractive();
       this.startBtn.on('pointerdown', async () => {
           this.themeMusic.pause();
           console.log("Clicked")

          //  console.log(this.retrievedLevels[this.levelSelected - 2])
           game.scene.start('GameScene', {level: this.levelSelected === 1 ? false : this.retrievedLevels[this.levelSelected - 2].levelData});
           game.scene.stop('LevelSelectScene');
   
       });

       this.nextBtn = this.add.image(600, 400, 'nextBtn');
       this.nextBtn.setInteractive();
       this.nextBtn.on('pointerdown', async () => {
           //cycles through the list, 1 will be default level, subsequent levels will be DB stored levels
           this.levelSelected = this.levelSelected < this.retrievedLevels.length + 1 ? this.levelSelected + 1 : 1;
   
       });

       this.prevBtn = this.add.image(200, 400, 'nextBtn');
       this.prevBtn.flipX = true;
       this.prevBtn.setInteractive();
       this.prevBtn.on('pointerdown', async () => {
           //cycles through the list, 1 will be default level, subsequent levels will be DB stored levels
           this.levelSelected = this.levelSelected > 1 ? this.levelSelected - 1 : this.retrievedLevels.length + 1 ;
   
       });
    }
    
    update(){
    
      this.cloudsWhite.tilePositionX += 0.5;
      this.cloudsWhiteSmall.tilePositionX += 0.25;
    
      this.levelSelectedText.setText(`${this.levelSelected}`);
    }
    
    async getData(){
      try {
        const response = await fetch("http://localhost:5001/levels")
        const dataToReturn = await response.json();
        return dataToReturn;
      } catch (error) {
          return error;
      }
    }

}

export default LevelSelectScene;

//this is how you restart a scene allegedly
//this.scene.restart();