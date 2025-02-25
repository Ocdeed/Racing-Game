class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.setupCanvas();

    // Game state
    this.isPlaying = false;
    this.score = 0;
    this.speed = 2;
    this.baseSpeed = 2;

    // Car properties
    this.car = {
      x: this.canvas.width / 2,
      y: this.canvas.height - 100,
      width: 50,
      height: 80,
      velocity: { x: 0, y: 0 },
    };

    // Arrays for game objects
    this.obstacles = [];
    this.powerUps = [];

    // Track properties
    this.trackOffset = 0;

    // Controls
    this.keys = {};
    this.touchStart = null;

    // Add new properties for obstacle generation
    this.lastObstacleTime = 0;
    this.obstacleInterval = 2000; // 2 seconds
    this.score = 0;
    this.displaySpeed = 0;

    // Add mobile control button states
    this.mobileControls = {
      left: false,
      right: false,
      accelerate: false,
      brake: false,
    };

    this.bindEvents();
    this.loadSounds();
  }

  setupCanvas() {
    this.canvas.width = 600;
    this.canvas.height = 800;
    if (window.innerWidth <= 600) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = 600;
    }
  }

  bindEvents() {
    document.addEventListener("keydown", (e) => (this.keys[e.key] = true));
    document.addEventListener("keyup", (e) => (this.keys[e.key] = false));

    // Touch controls
    this.canvas.addEventListener("touchstart", (e) => {
      this.touchStart = e.touches[0].clientX;
    });

    this.canvas.addEventListener("touchmove", (e) => {
      if (!this.touchStart) return;
      e.preventDefault();
      const touch = e.touches[0];
      const diff = touch.clientX - this.touchStart;
      this.car.x += diff / 5;
      this.touchStart = touch.clientX;
    });

    this.canvas.addEventListener("touchend", () => {
      this.touchStart = null;
    });

    // UI Buttons
    document
      .getElementById("startButton")
      .addEventListener("click", () => this.start());
    document
      .getElementById("restartButton")
      .addEventListener("click", () => this.restart());

    // Mobile control buttons
    const buttons = {
      leftBtn: "left",
      rightBtn: "right",
      accelerateBtn: "accelerate",
      brakeBtn: "brake",
    };

    Object.entries(buttons).forEach(([btnId, control]) => {
      const button = document.getElementById(btnId);
      if (button) {
        button.addEventListener("touchstart", (e) => {
          e.preventDefault();
          this.mobileControls[control] = true;
        });
        button.addEventListener("touchend", (e) => {
          e.preventDefault();
          this.mobileControls[control] = false;
        });
      }
    });
  }

  loadSounds() {
    this.sounds = {
      engine: document.getElementById("engineSound"),
      crash: document.getElementById("crashSound"),
      nitro: document.getElementById("nitroSound"),
    };
  }

  start() {
    document.getElementById("startScreen").classList.add("hidden");
    this.isPlaying = true;
    this.score = 0;
    this.speed = this.baseSpeed;
    this.sounds.engine.play();
    this.gameLoop();
  }

  gameLoop() {
    if (!this.isPlaying) return;

    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    this.updateCar();
    this.updateObstacles();
    this.checkCollisions();
    this.updateScore();
    this.updateSpeed();
  }

  updateCar() {
    // Update car controls to include mobile buttons
    if (this.keys["ArrowLeft"] || this.keys["a"] || this.mobileControls.left) {
      this.car.velocity.x = -5;
    } else if (
      this.keys["ArrowRight"] ||
      this.keys["d"] ||
      this.mobileControls.right
    ) {
      this.car.velocity.x = 5;
    } else {
      this.car.velocity.x *= 0.9;
    }

    // Handle acceleration and braking
    if (this.mobileControls.accelerate) {
      this.speed = Math.min(this.speed * 1.02, this.baseSpeed * 2);
    } else if (this.mobileControls.brake) {
      this.speed = Math.max(this.speed * 0.98, this.baseSpeed * 0.5);
    }

    this.car.x += this.car.velocity.x;
    this.car.x = Math.max(
      0,
      Math.min(this.canvas.width - this.car.width, this.car.x)
    );
  }

  updateObstacles() {
    // Generate new obstacles
    const currentTime = Date.now();
    if (currentTime - this.lastObstacleTime > this.obstacleInterval) {
      const obstacle = {
        x: Math.random() * (this.canvas.width - 40),
        y: -50,
        width: 40,
        height: 80,
        color: "#ff0000",
      };
      this.obstacles.push(obstacle);
      this.lastObstacleTime = currentTime;
      // Decrease interval as game progresses
      this.obstacleInterval = Math.max(500, 2000 - this.score / 100);
    }

    // Move existing obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      obstacle.y += this.speed * 2;

      // Remove obstacles that are off screen
      if (obstacle.y > this.canvas.height) {
        this.obstacles.splice(i, 1);
        this.score += 10; // Score for successfully avoiding obstacle
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawTrack();
    this.drawCar();
    this.drawObstacles();
    this.drawEffects();
  }

  drawTrack() {
    // Track background
    this.ctx.fillStyle = "#1c2526";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Lane markings
    this.trackOffset = (this.trackOffset + this.speed) % 40;
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.setLineDash([20, 20]);

    for (let i = -this.trackOffset; i < this.canvas.height; i += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.canvas.width / 2, i);
      this.ctx.lineTo(this.canvas.width / 2, i + 20);
      this.ctx.stroke();
    }
  }

  drawCar() {
    this.ctx.save();
    this.ctx.translate(
      this.car.x + this.car.width / 2,
      this.car.y + this.car.height / 2
    );
    this.ctx.rotate(this.car.velocity.x * 0.02);

    // Car body
    this.ctx.fillStyle = "#ff4500";
    this.ctx.fillRect(
      -this.car.width / 2,
      -this.car.height / 2,
      this.car.width,
      this.car.height
    );

    // Windows
    this.ctx.fillStyle = "#333";
    this.ctx.fillRect(
      -this.car.width / 3,
      -this.car.height / 3,
      (this.car.width * 2) / 3,
      this.car.height / 2
    );

    this.ctx.restore();
  }

  drawObstacles() {
    for (const obstacle of this.obstacles) {
      this.ctx.fillStyle = obstacle.color;
      this.ctx.fillRect(
        obstacle.x,
        obstacle.y,
        obstacle.width,
        obstacle.height
      );
    }
  }

  checkCollisions() {
    for (let obstacle of this.obstacles) {
      if (this.isColliding(this.car, obstacle)) {
        this.gameOver();
        return;
      }
    }
  }

  isColliding(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  gameOver() {
    this.isPlaying = false;
    this.sounds.engine.pause();
    this.sounds.crash.play();
    document.getElementById("gameOverScreen").classList.remove("hidden");
    document.getElementById("finalScore").textContent = this.score;

    // Update high score
    const highScore = localStorage.getItem("highScore") || 0;
    if (this.score > highScore) {
      localStorage.setItem("highScore", this.score);
      document.getElementById("highScore").textContent = this.score;
    }
  }

  restart() {
    this.obstacles = [];
    this.powerUps = [];
    document.getElementById("gameOverScreen").classList.add("hidden");
    this.start();
  }

  updateScore() {
    this.score += 1;
    document.getElementById("score").textContent = this.score;
  }

  updateSpeed() {
    // Gradually increase speed based on score
    this.speed = this.baseSpeed + this.score / 1000;
    this.displaySpeed = Math.floor(this.speed * 30); // Convert to km/h for display
    document.getElementById("speed").textContent = this.displaySpeed;
  }

  drawEffects() {
    // Add visual effects based on speed
    if (this.speed > this.baseSpeed * 1.5) {
      this.ctx.fillStyle = "rgba(255, 69, 0, 0.2)";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

// Initialize game when page loads
window.addEventListener("load", () => {
  const game = new Game();
});
