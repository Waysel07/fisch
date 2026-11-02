const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const startBtn = document.getElementById("start");

const SIZE = 16;                       // size of one cell in pixels
const CELLS = canvas.width / SIZE;     // 20 x 20 grid
const SPEED = 110;                     // ms per step (lower = faster)

let snake, dir, nextDir, food, score, loop;
let best = 0;

function reset() {
  snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  dir = { x: 1, y: 0 };
  nextDir = dir;
  score = 0;
  scoreEl.textContent = score;
  placeFood();
}

function placeFood() {
  do {
    food = {
      x: Math.floor(Math.random() * CELLS),
      y: Math.floor(Math.random() * CELLS),
    };
  } while (snake.some(p => p.x === food.x && p.y === food.y));
}

function step() {
  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  // Hit a wall or itself -> game over
  const hitWall = head.x < 0 || head.y < 0 || head.x >= CELLS || head.y >= CELLS;
  const hitSelf = snake.some(p => p.x === head.x && p.y === head.y);
  if (hitWall || hitSelf) {
    gameOver();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreEl.textContent = score;
    placeFood();
  } else {
    snake.pop();
  }

  draw();
}

function draw() {
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // food
  ctx.fillStyle = "#ef4444";
  ctx.fillRect(food.x * SIZE + 2, food.y * SIZE + 2, SIZE - 4, SIZE - 4);

  // snake
  snake.forEach((p, i) => {
    ctx.fillStyle = i === 0 ? "#4ade80" : "#22c55e";
    ctx.fillRect(p.x * SIZE + 1, p.y * SIZE + 1, SIZE - 2, SIZE - 2);
  });
}

function gameOver() {
  clearInterval(loop);
  loop = null;
  if (score > best) {
    best = score;
    bestEl.textContent = best;
  }
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
  startBtn.textContent = "Play again";
}

function start() {
  clearInterval(loop);
  reset();
  draw();
  loop = setInterval(step, SPEED);
  startBtn.textContent = "Restart";
}

function turn(name) {
  const dirs = {
    up:    { x: 0, y: -1 },
    down:  { x: 0, y: 1 },
    left:  { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };
  const d = dirs[name];
  // can't reverse straight into yourself
  if (d && (d.x !== -dir.x || d.y !== -dir.y)) {
    nextDir = d;
  }
}

document.addEventListener("keydown", e => {
  const keys = {
    ArrowUp: "up", w: "up", W: "up",
    ArrowDown: "down", s: "down", S: "down",
    ArrowLeft: "left", a: "left", A: "left",
    ArrowRight: "right", d: "right", D: "right",
  };
  if (keys[e.key]) {
    e.preventDefault();
    if (!loop) start();
    turn(keys[e.key]);
  }
});

document.querySelectorAll(".pad button").forEach(btn => {
  btn.addEventListener("click", () => {
    if (!loop) start();
    turn(btn.dataset.dir);
  });
});

startBtn.addEventListener("click", start);

// draw the starting board
reset();
draw();
