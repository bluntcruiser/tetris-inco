const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30;

const COLORS = [
    '#000000',
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FECA57',
    '#FF9FF3',
    '#A8E6CF'
];

const TETROMINOS = {
    I: [
        [[1,1,1,1]]
    ],
    O: [
        [[2,2],
         [2,2]]
    ],
    T: [
        [[0,3,0],
         [3,3,3]],
        [[3,0],
         [3,3],
         [3,0]],
        [[3,3,3],
         [0,3,0]],
        [[0,3],
         [3,3],
         [0,3]]
    ],
    S: [
        [[0,4,4],
         [4,4,0]],
        [[4,0],
         [4,4],
         [0,4]]
    ],
    Z: [
        [[5,5,0],
         [0,5,5]],
        [[0,5],
         [5,5],
         [5,0]]
    ],
    J: [
        [[6,0,0],
         [6,6,6]],
        [[6,6],
         [6,0],
         [6,0]],
        [[6,6,6],
         [0,0,6]],
        [[0,6],
         [0,6],
         [6,6]]
    ],
    L: [
        [[0,0,7],
         [7,7,7]],
        [[7,0],
         [7,0],
         [7,7]],
        [[7,7,7],
         [7,0,0]],
        [[7,7],
         [0,7],
         [0,7]]
    ]
};

let board = [];
let currentPiece = null;
let nextPiece = null;
let gameRunning = false;
let gamePaused = false;
let dropTime = 0;
let dropInterval = 1000;
let score = 0;
let lines = 0;
let level = 1;

let canvas, ctx, nextCanvas, nextCtx;

function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    nextCanvas = document.getElementById('next-canvas');
    nextCtx = nextCanvas.getContext('2d');
    
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        board[y] = [];
        for (let x = 0; x < BOARD_WIDTH; x++) {
            board[y][x] = 0;
        }
    }
    
    document.addEventListener('keydown', handleKeyPress);
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    document.getElementById('restart-game-btn').addEventListener('click', restartGame);
    document.getElementById('pause-btn').addEventListener('click', togglePause);
    
    document.getElementById('left-btn').addEventListener('click', () => movePiece(-1, 0));
    document.getElementById('right-btn').addEventListener('click', () => movePiece(1, 0));
    document.getElementById('down-btn').addEventListener('click', () => movePiece(0, 1));
    document.getElementById('rotate-btn').addEventListener('click', rotatePiece);
    
    document.addEventListener('touchstart', handleTouch, {passive: false});
    document.addEventListener('touchmove', handleTouch, {passive: false});
    
    startGame();
}

function handleTouch(e) {
    if (e.target.closest('.mobile-controls')) {
        e.preventDefault();
    }
}

function createPiece() {
    const pieces = Object.keys(TETROMINOS);
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
    const shape = TETROMINOS[randomPiece];
    
    return {
        x: Math.floor(BOARD_WIDTH / 2) - Math.floor(shape[0][0].length / 2),
        y: 0,
        shape: shape,
        rotation: 0,
        type: randomPiece
    };
}

function startGame() {
    gameRunning = true;
    gamePaused = false;
    score = 0;
    lines = 0;
    level = 1;
    dropInterval = 1000;
    
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            board[y][x] = 0;
        }
    }
    
    currentPiece = createPiece();
    nextPiece = createPiece();
    
    updateDisplay();
    hideGameOver();
    
    gameLoop();
}

function restartGame() {
    startGame();
}

function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    const pauseBtn = document.getElementById('pause-btn');
    pauseBtn.textContent = gamePaused ? 'Resume' : 'Pause';
    
    if (!gamePaused) {
        gameLoop();
    }
}

function gameLoop() {
    if (!gameRunning || gamePaused) return;
    
    const now = Date.now();
    if (now - dropTime > dropInterval) {
        if (!movePiece(0, 1)) {
            placePiece();
            clearLines();
            currentPiece = nextPiece;
            nextPiece = createPiece();
            
            if (checkGameOver()) {
                gameOver();
                return;
            }
        }
        dropTime = now;
    }
    
    draw();
    requestAnimationFrame(gameLoop);
}

function movePiece(dx, dy) {
    if (!currentPiece) return false;
    
    const newX = currentPiece.x + dx;
    const newY = currentPiece.y + dy;
    
    if (isValidMove(newX, newY, currentPiece.shape[currentPiece.rotation])) {
        currentPiece.x = newX;
        currentPiece.y = newY;
        return true;
    }
    return false;
}

function rotatePiece() {
    if (!currentPiece) return;
    
    const newRotation = (currentPiece.rotation + 1) % currentPiece.shape.length;
    const newShape = currentPiece.shape[newRotation];
    
    if (isValidMove(currentPiece.x, currentPiece.y, newShape)) {
        currentPiece.rotation = newRotation;
    }
}

function isValidMove(x, y, shape) {
    for (let py = 0; py < shape.length; py++) {
        for (let px = 0; px < shape[py].length; px++) {
            if (shape[py][px] !== 0) {
                const newX = x + px;
                const newY = y + py;
                
                if (newX < 0 || newX >= BOARD_WIDTH || 
                    newY >= BOARD_HEIGHT || 
                    (newY >= 0 && board[newY][newX] !== 0)) {
                    return false;
                }
            }
        }
    }
    return true;
}

function placePiece() {
    if (!currentPiece) return;
    
    const shape = currentPiece.shape[currentPiece.rotation];
    for (let py = 0; py < shape.length; py++) {
        for (let px = 0; px < shape[py].length; px++) {
            if (shape[py][px] !== 0) {
                const boardX = currentPiece.x + px;
                const boardY = currentPiece.y + py;
                if (boardY >= 0) {
                    board[boardY][boardX] = shape[py][px];
                }
            }
        }
    }
}

function clearLines() {
    let linesCleared = 0;
    
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        let filled = true;
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (board[y][x] === 0) {
                filled = false;
                break;
            }
        }
        
        if (filled) {
            board.splice(y, 1);
            board.unshift(new Array(BOARD_WIDTH).fill(0));
            linesCleared++;
            y++;
        }
    }
    
    if (linesCleared > 0) {
        lines += linesCleared;
        
        const linePoints = [0, 100, 300, 500, 800];
        score += linePoints[linesCleared] * level;
        
        level = Math.floor(lines / 10) + 1;
        dropInterval = Math.max(50, 1000 - (level - 1) * 50);
        
        updateDisplay();
    }
}

function checkGameOver() {
    const shape = currentPiece.shape[currentPiece.rotation];
    return !isValidMove(currentPiece.x, currentPiece.y, shape);
}

function gameOver() {
    gameRunning = false;
    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over').style.display = 'block';
}

function hideGameOver() {
    document.getElementById('game-over').style.display = 'none';
}

function updateDisplay() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lines').textContent = lines;
}

function handleKeyPress(e) {
    if (!gameRunning || gamePaused) {
        if (e.code === 'Space') {
            togglePause();
        }
        return;
    }
    
    switch(e.code) {
        case 'ArrowLeft':
        case 'KeyA':
            e.preventDefault();
            movePiece(-1, 0);
            break;
        case 'ArrowRight':
        case 'KeyD':
            e.preventDefault();
            movePiece(1, 0);
            break;
        case 'ArrowDown':
        case 'KeyS':
            e.preventDefault();
            movePiece(0, 1);
            break;
        case 'ArrowUp':
        case 'KeyW':
            e.preventDefault();
            rotatePiece();
            break;
        case 'Space':
            e.preventDefault();
            togglePause();
            break;
    }
}

function draw() {
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawGrid();
    drawBoard();
    
    if (currentPiece) {
        drawPiece(currentPiece, ctx);
    }
    
    drawNextPiece();
}

function drawGrid() {
    ctx.strokeStyle = '#34495e';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= BOARD_WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * BLOCK_SIZE, 0);
        ctx.lineTo(x * BLOCK_SIZE, BOARD_HEIGHT * BLOCK_SIZE);
        ctx.stroke();
    }
    
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * BLOCK_SIZE);
        ctx.lineTo(BOARD_WIDTH * BLOCK_SIZE, y * BLOCK_SIZE);
        ctx.stroke();
    }
}

function drawBoard() {
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (board[y][x] !== 0) {
                drawBlock(x * BLOCK_SIZE, y * BLOCK_SIZE, COLORS[board[y][x]], ctx);
            }
        }
    }
}

function drawPiece(piece, context) {
    const shape = piece.shape[piece.rotation];
    for (let py = 0; py < shape.length; py++) {
        for (let px = 0; px < shape[py].length; px++) {
            if (shape[py][px] !== 0) {
                const x = (piece.x + px) * BLOCK_SIZE;
                const y = (piece.y + py) * BLOCK_SIZE;
                drawBlock(x, y, COLORS[shape[py][px]], context);
            }
        }
    }
}

function drawNextPiece() {
    nextCtx.fillStyle = '#f8f9fa';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    if (!nextPiece) return;
    
    const shape = nextPiece.shape[0];
    const blockSize = 20;
    const offsetX = (nextCanvas.width - shape[0].length * blockSize) / 2;
    const offsetY = (nextCanvas.height - shape.length * blockSize) / 2;
    
    for (let py = 0; py < shape.length; py++) {
        for (let px = 0; px < shape[py].length; px++) {
            if (shape[py][px] !== 0) {
                const x = offsetX + px * blockSize;
                const y = offsetY + py * blockSize;
                drawBlock(x, y, COLORS[shape[py][px]], nextCtx, blockSize);
            }
        }
    }
}

function drawBlock(x, y, color, context, size = BLOCK_SIZE) {
    context.fillStyle = color;
    context.fillRect(x, y, size, size);
    
    context.fillStyle = lightenColor(color, 0.3);
    context.fillRect(x, y, size, 2);
    context.fillRect(x, y, 2, size);
    
    context.fillStyle = darkenColor(color, 0.3);
    context.fillRect(x + size - 2, y, 2, size);
    context.fillRect(x, y + size - 2, size, 2);
}

function lightenColor(color, factor) {
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + factor * 255);
    const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + factor * 255);
    const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + factor * 255);
    return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
}

function darkenColor(color, factor) {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - factor * 255);
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - factor * 255);
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - factor * 255);
    return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
}

window.addEventListener('load', init);
