const canvas = document.getElementById("jeu");
const ctx = canvas.getContext("2d");
const menu = document.getElementById("menu");
const startButton = document.getElementById("demarrer");
const soundButton = document.getElementById("son");
const leftButton = document.getElementById("gauche");
const rightButton = document.getElementById("droite");

const hud = {
    distance: document.getElementById("distance"),
    score: document.getElementById("score"),
    speed: document.getElementById("vitesse")
};

const rider = { x: 200, y: 500, width: 42, height: 78, lean: 0 };
const lanes = [105, 200, 295];
let obstacles = [];
let coins = [];
let particles = [];
let keys = {};
let active = false;
let soundOn = true;
let lives = 3;
let score = 0;
let distance = 0;
let speed = 125;
let roadOffset = 0;
let obstacleTimer = 0;
let coinTimer = 0;
let invincible = 0;
let lastTime = performance.now();

function beep(frequency, duration = 0.08) {
    if (!soundOn) return;
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const audio = new AudioContextClass();
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        oscillator.frequency.value = frequency;
        gain.gain.value = 0.055;
        oscillator.connect(gain);
        gain.connect(audio.destination);
        oscillator.start();
        oscillator.stop(audio.currentTime + duration);
        oscillator.onended = () => audio.close();
    } catch (_) {}
}

function startGame() {
    rider.x = 200;
    rider.lean = 0;
    obstacles = [];
    coins = [];
    particles = [];
    keys = {};
    lives = 3;
    score = 0;
    distance = 0;
    speed = 125;
    obstacleTimer = 0;
    coinTimer = 0;
    invincible = 0;
    active = true;
    menu.style.display = "none";
    updateLives();
    lastTime = performance.now();
    beep(440, 0.12);
}

function endGame() {
    active = false;
    menu.innerHTML = `
        <div class="menu-card">
            <p class="eyebrow">COURSE TERMINÉE</p>
            <h2>${Math.floor(distance)} m</h2>
            <p>Score : ${Math.floor(score)}<br>Appuie sur rejouer pour repartir.</p>
            <button id="demarrer" class="primary-button">REJOUER</button>
        </div>`;
    menu.style.display = "grid";
    document.getElementById("demarrer").addEventListener("click", startGame);
}

function updateLives() {
    for (let i = 1; i <= 3; i++) {
        document.getElementById(`life${i}`).style.opacity = i <= lives ? "1" : ".15";
    }
}

function intersects(a, b) {
    return a.x - a.width / 2 < b.x + b.width / 2 &&
        a.x + a.width / 2 > b.x - b.width / 2 &&
        a.y - a.height / 2 < b.y + b.height / 2 &&
        a.y + a.height / 2 > b.y - b.height / 2;
}

function spawnObstacle() {
    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    const isCone = Math.random() < 0.35;
    obstacles.push({
        x: lane,
        y: -70,
        width: isCone ? 34 : 48,
        height: isCone ? 42 : 72,
        type: isCone ? "cone" : "car",
        drift: isCone ? 0 : (Math.random() - 0.5) * 18
    });
}

function spawnCoin() {
    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    coins.push({ x: lane, y: -40, width: 24, height: 24, spin: Math.random() * 6 });
}

function hitRider() {
    if (invincible > 0) return;
    lives--;
    invincible = 1.5;
    updateLives();
    beep(90, 0.18);
    for (let i = 0; i < 12; i++) {
        particles.push({
            x: rider.x,
            y: rider.y,
            vx: (Math.random() - 0.5) * 180,
            vy: (Math.random() - 0.5) * 180,
            life: 0.7
        });
    }
    if (lives <= 0) endGame();
}

function drawRoad() {
    ctx.fillStyle = "#78ad63";
    ctx.fillRect(0, 0, 400, 600);
    ctx.fillStyle = "#34373a";
    ctx.beginPath();
    ctx.moveTo(60, 0);
    ctx.lineTo(340, 0);
    ctx.lineTo(380, 600);
    ctx.lineTo(20, 600);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#f4f0dc";
    ctx.beginPath();
    ctx.moveTo(54, 0); ctx.lineTo(62, 0); ctx.lineTo(22, 600); ctx.lineTo(14, 600); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(338, 0); ctx.lineTo(346, 0); ctx.lineTo(386, 600); ctx.lineTo(378, 600); ctx.fill();

    ctx.fillStyle = "#e8e5d8";
    for (let y = roadOffset - 100; y < 650; y += 100) {
        ctx.fillRect(135, y, 7, 55);
        ctx.fillRect(258, y, 7, 55);
    }

    ctx.fillStyle = "#ff5a1f";
    for (let y = roadOffset - 30; y < 620; y += 120) {
        ctx.beginPath();
        ctx.moveTo(35, y); ctx.lineTo(49, y); ctx.lineTo(57, y + 18); ctx.lineTo(27, y + 18); ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(351, y); ctx.lineTo(365, y); ctx.lineTo(373, y + 18); ctx.lineTo(343, y + 18); ctx.closePath();
        ctx.fill();
    }
}

function drawMotorcycle() {
    ctx.save();
    ctx.translate(rider.x, rider.y);
    ctx.rotate(rider.lean * 0.035);

    ctx.strokeStyle = "#17181a";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, 21, 17, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -24, 12, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#ff5a1f";
    ctx.beginPath();
    ctx.moveTo(-13, -18);
    ctx.quadraticCurveTo(0, -34, 13, -18);
    ctx.lineTo(10, 20);
    ctx.quadraticCurveTo(0, 30, -10, 20);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#17181a";
    ctx.fillRect(-18, -30, 36, 7);
    ctx.fillStyle = "#f6f0df";
    ctx.fillRect(-6, -24, 12, 16);
    ctx.restore();
}

function drawObstacle(obstacle) {
    ctx.save();
    ctx.translate(obstacle.x, obstacle.y);
    if (obstacle.type === "cone") {
        ctx.fillStyle = "#ff7a24";
        ctx.beginPath();
        ctx.moveTo(0, -21); ctx.lineTo(17, 21); ctx.lineTo(-17, 21); ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#17181a";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = "#f6f0df";
        ctx.fillRect(-11, 5, 22, 5);
    } else {
        ctx.fillStyle = "#f3c623";
        ctx.fillRect(-24, -36, 48, 72);
        ctx.fillStyle = "#17181a";
        ctx.fillRect(-28, -24, 6, 18);
        ctx.fillRect(22, -24, 6, 18);
        ctx.fillRect(-28, 18, 6, 18);
        ctx.fillRect(22, 18, 6, 18);
        ctx.fillStyle = "#dceaf1";
        ctx.fillRect(-15, -25, 30, 19);
    }
    ctx.restore();
}

function drawCoin(coin) {
    ctx.save();
    ctx.translate(coin.x, coin.y);
    ctx.scale(Math.abs(Math.cos(coin.spin)) * 0.7 + 0.3, 1);
    ctx.fillStyle = "#ffc928";
    ctx.strokeStyle = "#17181a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#17181a";
    ctx.fillRect(-2, -7, 4, 14);
    ctx.restore();
}

function update(dt) {
    if (!active) return;

    const targetSpeed = 125 + Math.min(distance / 12, 85);
    speed += (targetSpeed - speed) * dt;
    distance += speed * dt / 3.6;
    score += dt * speed * 0.12;
    roadOffset = (roadOffset + speed * dt * 1.8) % 100;

    const direction = (keys.ArrowLeft || keys.a ? -1 : 0) +
        (keys.ArrowRight || keys.d ? 1 : 0);
    rider.x += direction * 260 * dt;
    rider.lean += (direction - rider.lean) * 10 * dt;
    rider.x = Math.max(55, Math.min(345, rider.x));
    if (direction === 0) rider.lean *= 0.88;

    obstacleTimer -= dt;
    coinTimer -= dt;
    invincible -= dt;
    if (obstacleTimer <= 0) {
        spawnObstacle();
        obstacleTimer = Math.max(0.55, 1.25 - distance / 900);
    }
    if (coinTimer <= 0) {
        spawnCoin();
        coinTimer = 1.2 + Math.random() * 1.1;
    }

    const roadSpeed = 170 + speed * 1.05;
    obstacles.forEach(obstacle => {
        obstacle.y += roadSpeed * dt;
        obstacle.x += obstacle.drift * dt;
    });
    coins.forEach(coin => {
        coin.y += roadSpeed * dt;
        coin.spin += dt * 6;
    });
    particles.forEach(particle => {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.life -= dt;
    });
    particles = particles.filter(particle => particle.life > 0);

    for (let i = obstacles.length - 1; i >= 0; i--) {
        if (intersects(rider, obstacles[i])) {
            obstacles.splice(i, 1);
            hitRider();
        } else if (obstacles[i].y > 660) {
            obstacles.splice(i, 1);
            score += 15;
        }
    }

    for (let i = coins.length - 1; i >= 0; i--) {
        if (intersects(rider, coins[i])) {
            coins.splice(i, 1);
            score += 100;
            beep(660, 0.09);
        } else if (coins[i].y > 660) {
            coins.splice(i, 1);
        }
    }

    hud.distance.textContent = Math.floor(distance);
    hud.score.textContent = Math.floor(score);
    hud.speed.textContent = Math.floor(speed);
}

function draw() {
    drawRoad();
    coins.forEach(drawCoin);
    obstacles.forEach(drawObstacle);

    particles.forEach(particle => {
        ctx.globalAlpha = Math.max(0, particle.life);
        ctx.fillStyle = "#ff5a1f";
        ctx.fillRect(particle.x, particle.y, 5, 5);
    });
    ctx.globalAlpha = 1;

    if (invincible <= 0 || Math.floor(invincible * 10) % 2 === 0) drawMotorcycle();
}

function loop(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    update(dt);
    draw();
    requestAnimationFrame(loop);
}

window.addEventListener("keydown", event => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(event.key)) event.preventDefault();
    keys[event.key] = true;
    keys[event.key.toLowerCase()] = true;
});
window.addEventListener("keyup", event => {
    keys[event.key] = false;
    keys[event.key.toLowerCase()] = false;
});

function bindTouch(button, key) {
    button.addEventListener("pointerdown", event => {
        event.preventDefault();
        keys[key] = true;
        button.setPointerCapture(event.pointerId);
    });
    button.addEventListener("pointerup", () => { keys[key] = false; });
    button.addEventListener("pointercancel", () => { keys[key] = false; });
}

bindTouch(leftButton, "ArrowLeft");
bindTouch(rightButton, "ArrowRight");
startButton.addEventListener("click", startGame);
soundButton.addEventListener("click", () => {
    soundOn = !soundOn;
    soundButton.textContent = soundOn ? "SON ON" : "SON OFF";
});

draw();
requestAnimationFrame(loop);
