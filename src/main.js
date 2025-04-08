
import './style.css'
import Phaser from 'phaser'

//this object holds all of the important properties for the game
const gameState = {}

//This scene opens up the game
class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload()  {
    
  }

  create () {
    let welcomeMessage = this.add.text(350, 10, "Welcome", {
      font: "30px PMingLiu", 
      fill: "red"
    });

    let instructMessage = this.add.text(370, 50, "Click to start", {
      font: "15px PMingLiu", 
      fill: "red"
    });

    this.input.on("pointerup", () => {
      this.scene.stop("BootScene");
      this.scene.start("MainScene");
    }, this);

    
  }

}

//This scene is for the game itself
class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }
  
  preload()  {
    this.load.image('fly', 'assets/fly.png');
    this.load.image('tree', 'assets/tree.png');
    this.load.image('stone', 'assets/stone.jpg');
  }  
    
  create () {
    //load environment markers
    this.add.sprite(100, 100, 'tree').setScale(0.05);
    this.add.sprite(700, 300, 'tree').setScale(0.05);
    this.add.sprite(300, 400, 'tree').setScale(0.05);
    this.add.sprite(600, 150, 'stone').setScale(0.05);
    this.add.sprite(150, 600, 'stone').setScale(0.05);

    //is the game over?
    gameState.end = false;

    gameState.cursors = this.input.keyboard.createCursorKeys();

    //status ring around fly
    gameState.statusRing = this.add.ellipse(17.5, 17.5, 25, 25, 0xFFFFF);
    gameState.statusRing.setOrigin(0.5);


    gameState.fly = this.physics.add.sprite(17.5, 17.5, 'fly');
    gameState.fly.setScale(0.0375);
    gameState.fly.setCollideWorldBounds(true);
    gameState.fly.setOrigin(0.5);

    gameState.distanceTraveled = 0;

    gameState.source = new Phaser.Math.Vector2(Phaser.Math.Between(50, 749),  Phaser.Math.Between(50, 449));
    gameState.slope = Phaser.Math.Between(0, 360);

    gameState.noiseArray = [];
    for (let i = 0; i < 5; i++) {
      let r = Math.random();
      if (r < 0.5) {
        gameState.noiseArray.push(-1);
      } else {
        gameState.noiseArray.push(1);
      }
    }

    //graphics object keeps track of the fly's trajectory
    gameState.graphics = this.add.graphics();
    gameState.graphics.beginPath();
    gameState.graphics.moveTo(gameState.fly.x, gameState.fly.y);
    gameState.graphics.lineStyle(0.5, 0xFF0000);
  }
  
  
  update (time) {
    //gameState.timeMessage.setText("Time elapsed:" + Math.round(time));
    //gameState.distanceTraveledMessage.setText("Distance traveled:" + gameState.distanceTraveled);
    //gameState.distanceToSourceMessage.setText("Distance to source: " 
    //  + Math.round(Phaser.Math.Distance.Between(gameState.fly.x, gameState.fly.y, gameState.source.x, gameState.source.y)));
    
    //keep track of the distance from source
    let distanceToSource = Phaser.Math.Distance.Between(gameState.fly.x, gameState.fly.y, gameState.source.x, gameState.source.y);
    let x_diff = gameState.fly.x - gameState.source.x;
    let y_diff = gameState.source.y - gameState.fly.y;
    let point = rotate(x_diff, y_diff, gameState.slope);

    //fly's displacement per input
    let delta_x = 0.5;
    let delta_y = 0.5;
    

    if (time % 60) {
      gameState.noiseArray = updateArray(gameState.noiseArray)
      gameState.noise = avg(gameState.noiseArray) * 150;
      console.log(gameState.noiseArray);
    }

    //calculate plume intensity with noise
    let plumeIntensity = Math.log(Gaussian(point.x, point.y, 0.25));
    plumeIntensity = plumeIntensity + gameState.noise;

    //input handling
    if (gameState.cursors.left.isDown) {
      gameState.statusRing.x -= delta_x;
      gameState.fly.x -= delta_x;
      gameState.fly.angle = -90;
      gameState.distanceTraveled += delta_x;
    } 

    if (gameState.cursors.right.isDown) {
      gameState.statusRing.x += delta_x;
      gameState.fly.x += delta_x;
      gameState.fly.angle = 90;
      gameState.distanceTraveled += delta_x;
    } 

    if (gameState.cursors.down.isDown) {
      gameState.statusRing.y += delta_y;
      gameState.fly.y += delta_y;
      gameState.fly.angle = 180;
      gameState.distanceTraveled += delta_y;
    } 

    if (gameState.cursors.up.isDown) {
      gameState.statusRing.y -= delta_y;
      gameState.fly.y -= delta_y;
      gameState.fly.angle = 0;
      gameState.distanceTraveled += delta_y;
    }
    
    //change orientation of fly sprite
    if (gameState.cursors.left.isDown && gameState.cursors.up.isDown) {
      gameState.fly.angle = -45;
    }

    if (gameState.cursors.right.isDown && gameState.cursors.up.isDown) {
      gameState.fly.angle = 45;
    }

    if (gameState.cursors.left.isDown && gameState.cursors.down.isDown) {
      gameState.fly.angle = -135;
    }

    if (gameState.cursors.right.isDown && gameState.cursors.down.isDown) {
      gameState.fly.angle = 135;
    }

    //update color of status ring
    setStatusRing(plumeIntensity);
    if(gameState.statusRing.x != gameState.fly.x) gameState.fly.x = gameState.statusRing.x;
    if(gameState.statusRing.y != gameState.fly.y) gameState.fly.y = gameState.statusRing.y;

    //update trajectory
    gameState.graphics.lineTo(gameState.fly.x, gameState.fly.y);

    //the game ends here
    if (distanceToSource < 25 && !gameState.end) {
      gameState.end = true;
      console.log("end")
      gameState.fly.destroy();
      gameState.statusRing.destroy();
      gameState.graphics.strokePath();

      let timeMessage = this.add.text(10, 20, "Time elapsed:" + Math.round(((time / 1000) * 1000)) / 1000, {
        font: "15px Arial", 
        fill: "black"
      });
  
      let distanceMessage = this.add.text(10, 50, "Distance traveled:" + gameState.distanceTraveled, {
        font: "15px Arial", 
        fill: "black"
      });

      this.add.text(10, 80, "Click to view heatmap", {
        font: "15px Arial", 
        fill: "black"
      });

      this.input.on("pointerup", () => {
        this.scene.stop("MainScene");
        this.scene.start("HeatmapScene", { x: gameState.source.x, y: gameState.source.y, slope: gameState.slope });
      }, this);

    }
  } 
}

//this scene is for the heatmap
class HeatmapScene extends Phaser.Scene {
  init(data) {
    this.x = data.x;
    this.y = data.y;
    this.slope = data.slope;
  }
  
  constructor() {
    super({ key: "HeatmapScene" });
  }

  create() {
    console.log(this.x);
    gameState.source = new Phaser.Math.Vector2(this.x, this.y);
    gameState.slope = this.slope;
    generateHeatmap(this, gameState);

    this.input.on("pointerup", () => {
      this.scene.stop("HeatmapScene");
      this.scene.start("BootScene");
    }, this);
  }
}

//to update fill color of status ring
function setStatusRing(plumeIntensity) {
  if (plumeIntensity < -300) {
    gameState.statusRing.setFillStyle(0xFFFFFF);
  } else if (plumeIntensity < -280) {
    gameState.statusRing.setFillStyle(0xFFEEEE);
  }  else if (plumeIntensity < -260) {
    gameState.statusRing.setFillStyle(0xFFDDDD);
  } else if (plumeIntensity < -240) {
    gameState.statusRing.setFillStyle(0xFFCCCC);
  } else if (plumeIntensity < -220) {
    gameState.statusRing.setFillStyle(0xFFBBBB);
  } else if (plumeIntensity < -200) {
    gameState.statusRing.setFillStyle(0xFFAAAA);
  } else if (plumeIntensity < -180) {
    gameState.statusRing.setFillStyle(0xFF9999);
  } else if (plumeIntensity < -160) {
    gameState.statusRing.setFillStyle(0xFF8888);
  } else if (plumeIntensity < -140) {
    gameState.statusRing.setFillStyle(0xFF7777);
  } else if (plumeIntensity < -120) {
    gameState.statusRing.setFillStyle(0xFF6666);
  } else if (plumeIntensity < -100) {
    gameState.statusRing.setFillStyle(0xFF5555);
  } else if (plumeIntensity < -80) {
    gameState.statusRing.setFillStyle(0xFF4444);
  } else if (plumeIntensity < -60) {
    gameState.statusRing.setFillStyle(0xFF3333);
  } else if (plumeIntensity < -40) {
    gameState.statusRing.setFillStyle(0xFF2222);
  } else if (plumeIntensity < -20) {
    gameState.statusRing.setFillStyle(0xFF1111);
  } else {
    gameState.statusRing.setFillStyle(0xFF0000);
  }
}

//to determine tile color of heatmap (could be merged with the function above)
function setTileColor(plumeIntensity) {
  if (plumeIntensity < -300) {
    return 0xFFFFFF;
  } else if (plumeIntensity < -280) {
    return 0xFFEEEE;
  }  else if (plumeIntensity < -260) {
    return 0xFFDDDD;
  } else if (plumeIntensity < -240) {
    return 0xFFCCCC;
  } else if (plumeIntensity < -220) {
    return 0xFFBBBB;
  } else if (plumeIntensity < -200) {
    return 0xFFAAAA;
  } else if (plumeIntensity < -180) {
    return 0xFF9999;
  } else if (plumeIntensity < -160) {
    return 0xFF8888;
  } else if (plumeIntensity < -140) {
    return 0xFF7777;
  } else if (plumeIntensity < -120) {
    return 0xFF6666;
  } else if (plumeIntensity < -100) {
    return 0xFF5555;
  } else if (plumeIntensity < -80) {
    return 0xFF4444;
  } else if (plumeIntensity < -60) {
    return 0xFF3333;
  } else if (plumeIntensity < -40) {
    return 0xFF2222;
  } else if (plumeIntensity < -20) {
    return 0xFF1111;
  } else {
    return 0xFF0000;
  }
}

//calculates plume intensity before noise
function Gaussian (x, y, diffusivity) {
  if (x < 0) return 0;
  var m = Math.sqrt(Math.PI * diffusivity * x);
  var e = Math.exp(-Math.pow(y, 2) / (diffusivity * x));
  return e / m;
} 

//used to calculate noise
function avg(array) {
  let sum = 0;
  for (let i = 0; i < 5; i++) {
    sum += array[i]; 
  }
  return sum / 5.0;
}

function updateArray(array) {
  array = array.slice(1, 5);
  let r = Math.random();
  if (r < 0.5) {
    array.push(-1);
  } else {
    array.push(1);
  }
  return array;
} 

//this function is deprecated
function GaussianNoise(plumeIntensity) {
  return plumeIntensity + 150 * (Math.random() - 0.5);
}

function rotate(x, y, theta) {
  theta = Math.PI * (theta / 180); 
  let x_rot = x * Math.cos(theta) - y * Math.sin(theta);
  let y_rot = x * Math.sin(theta) + y * Math.cos(theta);
  return new Phaser.Math.Vector2(x_rot, y_rot);
}

function generateHeatmap(scene, gameState) {
  for (let y = 0; y < 500; y+=2.5) {
    for (let x = 0; x < 800; x+=2.5) {
      let distanceToSource = Phaser.Math.Distance.Between(x, y, gameState.source.x, gameState.source.y);
      let x_diff = x - gameState.source.x;
      let y_diff = gameState.source.y - y;
      let point = rotate(x_diff, y_diff, gameState.slope);
      let plumeIntensity = Math.log(Gaussian(point.x, point.y, 0.25));
      console.log(plumeIntensity);

      let tile = scene.add.rectangle(x, y, 2.5, 2.5, setTileColor(plumeIntensity));
    }
  }
}

const config = {
  type: Phaser.WEBGL,
  width: 800,
  height: 500, 
  scene: [ BootScene, MainScene, HeatmapScene ]
  ,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0 },
      enableBody: true,
      debug: true
    }, 
  }, 
  fps: {
    forceTimeOut: true, 
    target: 30
  },
  backgroundColor: '#ffffff',
  canvas: gameCanvas
}

const game = new Phaser.Game(config);
