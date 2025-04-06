class TapJumpGame {
    constructor() {
        this.character = document.getElementById('gameCharacter');
        this.container = document.querySelector('.game-container');
        this.scoreElement = document.getElementById('gameScore');
        this.startButton = document.getElementById('gameStartBtn');
        
        this.score = 0;
        this.isPlaying = false;
        this.obstacles = [];
        this.jumpHeight = 120;
        this.gravity = 0.6;
        this.velocity = 0;
        this.isJumping = false;
        this.initialY = null;
        
        this.init();
    }
    
    init() {
        // Set initial character position
        if (this.character && this.container) {
            this.initialY = this.container.clientHeight * 0.8;
            this.character.style.bottom = `${this.container.clientHeight * 0.2}px`;
            
            // Event listeners
            this.container.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.isPlaying) this.jump();
            });
            
            this.startButton.addEventListener('click', () => this.startGame());
            
            // Handle visibility change
            document.addEventListener('visibilitychange', () => {
                if (document.hidden && this.isPlaying) {
                    this.pauseGame();
                }
            });
        }
    }
    
    startGame() {
        if (!this.isPlaying) {
            this.isPlaying = true;
            this.score = 0;
            this.scoreElement.textContent = '0';
            this.startButton.style.display = 'none';
            this.obstacles = [];
            this.spawnObstacle();
            this.gameLoop();
        }
    }
    
    pauseGame() {
        this.isPlaying = false;
        this.startButton.style.display = 'block';
        this.startButton.textContent = 'Continue';
        this.obstacles.forEach(obstacle => {
            if (obstacle.element) {
                obstacle.element.remove();
            }
        });
        this.obstacles = [];
    }
    
    jump() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.velocity = -15;
        }
    }
    
    spawnObstacle() {
        if (!this.isPlaying) return;
        
        const obstacle = document.createElement('div');
        obstacle.className = 'game-obstacle';
        this.container.appendChild(obstacle);
        
        const speed = 5 + Math.floor(this.score / 10);
        const obstacleObj = {
            element: obstacle,
            x: this.container.clientWidth,
            speed: speed
        };
        
        obstacle.style.left = `${obstacleObj.x}px`;
        obstacle.style.bottom = `${this.container.clientHeight * 0.2}px`;
        
        this.obstacles.push(obstacleObj);
        
        // Schedule next obstacle
        const minDelay = Math.max(1000 - this.score * 10, 500);
        const maxDelay = Math.max(2000 - this.score * 10, 1000);
        const delay = Math.random() * (maxDelay - minDelay) + minDelay;
        
        setTimeout(() => {
            if (this.isPlaying) this.spawnObstacle();
        }, delay);
    }
    
    updateObstacles() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.x -= obstacle.speed;
            
            if (obstacle.element) {
                if (obstacle.x < -50) {
                    obstacle.element.remove();
                    this.obstacles.splice(i, 1);
                    this.score++;
                    this.scoreElement.textContent = this.score;
                } else {
                    obstacle.element.style.left = `${obstacle.x}px`;
                    
                    // Collision detection
                    const characterRect = this.character.getBoundingClientRect();
                    const obstacleRect = obstacle.element.getBoundingClientRect();
                    
                    if (this.checkCollision(characterRect, obstacleRect)) {
                        this.gameOver();
                        return;
                    }
                }
            }
        }
    }
    
    checkCollision(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                rect1.left > rect2.right || 
                rect1.bottom < rect2.top || 
                rect1.top > rect2.bottom);
    }
    
    gameOver() {
        this.isPlaying = false;
        this.startButton.style.display = 'block';
        this.startButton.textContent = 'Play Again';
        
        // Save high score
        const highScore = localStorage.getItem('tapJumpHighScore') || 0;
        if (this.score > highScore) {
            localStorage.setItem('tapJumpHighScore', this.score);
        }
        
        // Show game over message
        const message = document.createElement('div');
        message.className = 'game-over-message';
        message.innerHTML = `
            <h3>Game Over!</h3>
            <p>Score: ${this.score}</p>
            <p>High Score: ${Math.max(this.score, highScore)}</p>
        `;
        this.container.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 2000);
        
        // Clear obstacles
        this.obstacles.forEach(obstacle => {
            if (obstacle.element) {
                obstacle.element.remove();
            }
        });
        this.obstacles = [];
    }
    
    updateCharacter() {
        if (!this.character || !this.isPlaying) return;
        
        if (this.isJumping) {
            this.velocity += this.gravity;
            const newY = parseInt(this.character.style.bottom) - this.velocity;
            
            if (newY <= this.container.clientHeight * 0.2) {
                this.character.style.bottom = `${this.container.clientHeight * 0.2}px`;
                this.isJumping = false;
                this.velocity = 0;
            } else {
                this.character.style.bottom = `${newY}px`;
            }
        }
    }
    
    gameLoop() {
        if (!this.isPlaying) return;
        
        this.updateCharacter();
        this.updateObstacles();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TapJumpGame();
}); 