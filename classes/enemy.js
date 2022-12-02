import Phaser from "phaser";

class Enemy {
    constructor(startX, startY, endX, health, animation, game, player){
        this.startX  = startX;
        this.endX = endX;
        this.startY = startY;
        this.health = health;
        this.animation = animation;

        this.object = game.physics.add.sprite(this.startX, this.startY, animation);
        game.physics.add.collider(this.object, game.layer); //this stops sprite from falling through the floor

        game.physics.add.collider(player, this.object, (player, enemy, game) => {
            if(this.hitFromTop(player, enemy)) this.takeDamage(1, game);
            else {
                game.gameOver(player, game);
                game.gameOverText.setText(game.livesLeft > 0 ? ' ' : 'Game Over'); 
                game.physics.pause();
              }
            }, null, game);

        Enemy.enemyList.push(this);
    }


    takeDamage(num){    
            this.health -= num
            this.object.setTint(0xff0000);
            game.time.addEvent({ delay: delay, callback: this.object.setTint(0), callbackScope: game, loop: false });
            if(this.health <= 0) this.destroyEnemy();
    }

    //on collision with enemy, check if we have hit the top or the side
    hitFromTop(player, object){
        return ((player.body.y + player.body.height) <= object.y) &&
                (player.body.x - object.x > 10 || object.x + object.width - player.body.x >10);
    }
      
    //Method destroy enemy if we have hit it from the top
    destroyEnemy(enemy){
        this.starSound.play();
        enemy.disableBody(true, true);
        this.score += 50;
        this.scoreText.setText('Score: ' + this.score);
      }

    //private array that contains all our enemies    
    static enemyList = [];

    setEnemyDirection(){
        for(let enemy of this.enemyList){
          if(Math.floor(enemy.object.x) === Math.floor(enemy.startX)){
            enemy.object.setVelocityX(-50);
            enemy.object.anims.play(this.animation, true);
            enemy.object.flipX = true;
          } else if(Math.floor(enemy.enemyObject.x) === Math.floor(enemy.endX)){
            enemy.object.setVelocityX(50);
            enemy.object.anims.play(this.animation, true);
            enemy.object.flipX = false;
          }
        }
      }
}

export default Enemy