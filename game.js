class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.scoreElement = document.getElementById('score');
        this.gameOver = false;
        this.gameStarted = false;
        
        // Game objects
        this.player = {
            x: 100,
            y: this.canvas.height / 2,
            width: 30,
            height: 30,
            speed: 5,
            color: '#3498db'
        };
        
        this.stars = [];
        this.obstacles = [];
        
        // Game settings
        this.starSpawnRate = 2000; // ms
        this.obstacleSpawnRate = 3000; // ms
        this.lastStarSpawn = 0;
        this.lastObstacleSpawn = 0;
        
        // Controls
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        
        // Bind methods
        this.update = this.update.bind(this);
        this.draw = this.draw.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        
        // Add event listeners
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        
        // Start game
        this.init();
    }
    
    init() {
        // Reset game state
        this.score = 0;
        this.scoreElement.textContent = this.score;
        this.gameOver = false;
        this.gameStarted = true;
        
        // Reset player position
        this.player.x = 100;
        this.player.y = this.canvas.height / 2;
        
        // Clear arrays
        this.stars = [];
        this.obstacles = [];
        
        // Start game loop
        this.gameLoop();
    }
    
    gameLoop() {
        if (!this.gameStarted) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update game state
        this.update();
        
        // Draw game objects
        this.draw();
        
        // Continue game loop
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        if (this.gameOver) return;
        
        // Move player
        if (this.keys.up && this.player.y > 0) {
            this.player.y -= this.player.speed;
        }
        if (this.keys.down && this.player.y < this.canvas.height - this.player.height) {
            this.player.y += this.player.speed;
        }
        if (this.keys.left && this.player.x > 0) {
            this.player.x -= this.player.speed;
        }
        if (this.keys.right && this.player.x < this.canvas.width - this.player.width) {
            this.player.x += this.player.speed;
        }
        
        // Spawn stars
        const now = Date.now();
        if (now - this.lastStarSpawn > this.starSpawnRate) {
            this.spawnStar();
            this.lastStarSpawn = now;
        }
        
        // Spawn obstacles
        if (now - this.lastObstacleSpawn > this.obstacleSpawnRate) {
            this.spawnObstacle();
            this.lastObstacleSpawn = now;
        }
        
        // Update stars
        for (let i = this.stars.length - 1; i >= 0; i--) {
            const star = this.stars[i];
            star.x -= star.speed;
            
            // Check collision with player
            if (this.checkCollision(this.player, star)) {
                this.score += 10;
                this.scoreElement.textContent = this.score;
                this.stars.splice(i, 1);
                continue;
            }
            
            // Remove stars that are off-screen
            if (star.x + star.width < 0) {
                this.stars.splice(i, 1);
            }
        }
        
        // Update obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.x -= obstacle.speed;
            
            // Check collision with player
            if (this.checkCollision(this.player, obstacle)) {
                this.gameOver = true;
                this.showGameOver();
                return;
            }
            
            // Remove obstacles that are off-screen
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
            }
        }
    }
    
    draw() {
        // Draw player
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Draw stars
        this.ctx.fillStyle = '#f1c40f';
        this.stars.forEach(star => {
            this.ctx.fillRect(star.x, star.y, star.width, star.height);
        });
        
        // Draw obstacles
        this.ctx.fillStyle = '#e74c3c';
        this.obstacles.forEach(obstacle => {
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        });
        
        // Draw game over screen
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '30px Poppins';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 30);
            
            this.ctx.font = '20px Poppins';
            this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
            this.ctx.fillText('Press SPACE to restart', this.canvas.width / 2, this.canvas.height / 2 + 50);
        }
    }
    
    spawnStar() {
        const star = {
            x: this.canvas.width,
            y: Math.random() * (this.canvas.height - 20),
            width: 20,
            height: 20,
            speed: 3
        };
        this.stars.push(star);
    }
    
    spawnObstacle() {
        const obstacle = {
            x: this.canvas.width,
            y: Math.random() * (this.canvas.height - 30),
            width: 30,
            height: 30,
            speed: 4
        };
        this.obstacles.push(obstacle);
    }
    
    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    handleKeyDown(e) {
        if (e.key === 'ArrowUp' || e.key === 'w') this.keys.up = true;
        if (e.key === 'ArrowDown' || e.key === 's') this.keys.down = true;
        if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = true;
        if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = true;
        
        // Restart game on space
        if (e.key === ' ' && this.gameOver) {
            this.init();
        }
    }
    
    handleKeyUp(e) {
        if (e.key === 'ArrowUp' || e.key === 'w') this.keys.up = false;
        if (e.key === 'ArrowDown' || e.key === 's') this.keys.down = false;
        if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = false;
        if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = false;
    }
    
    showGameOver() {
        // Game over is handled in the draw method
    }
}

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Rename the game section title
    const gameTitle = document.querySelector('#game .section-header h2');
    if (gameTitle) {
        gameTitle.textContent = 'Minigame';
    }
    
    // Initialize the game
    new Game();
}); 