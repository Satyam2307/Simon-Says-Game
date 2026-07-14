// Game State Variables
let gameSeq = [];
let userSeq = [];
let btns = ["green", "red", "yellow", "purple"];

let started = false;
let level = 0;
let highScore = localStorage.getItem("simonHighScore") || 0;
let isComputerFlashing = false;
let highScoreBeaten = false;

// Audio Synth Variables & Setup
let audioCtx = null;

const frequencies = {
    green: 329.63,  // E4 (pleasant chime)
    red: 261.63,    // C4
    yellow: 392.00, // G4
    purple: 523.25  // C5
};

// DOM Elements
const statusEl = document.getElementById("game-status");
const currentScoreEl = document.getElementById("current-score");
const highScoreEl = document.getElementById("high-score");
const startBtn = document.getElementById("start-btn");
const allBtns = document.querySelectorAll(".btn");

// Initialize High Score Display
highScoreEl.innerText = highScore;

// Audio Initializer on User Interaction
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Play Tone function using pure Web Audio synth
function playTone(color, duration = 300) {
    initAudio();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = "sine";
    osc.frequency.value = frequencies[color] || 220;

    // Smooth envelope to prevent audio pops
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration / 1000);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration / 1000);
}

// Play Game Over Buzz
function playGameOverSound() {
    initAudio();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(160, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(60, audioCtx.currentTime + 0.6);

    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.35, audioCtx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.6);
}

// Play High Score Arpeggio
function playHighScoreSound() {
    initAudio();
    if (!audioCtx) return;

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C4, E4, G4, C5, E5
    notes.forEach((freq, index) => {
        setTimeout(() => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.type = "triangle";
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);

            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.4);
        }, index * 80);
    });
}

// Visual and Sound Flashes
function gameFlash(btn) {
    const color = btn.getAttribute("id");
    playTone(color, 280);
    btn.classList.add("flash");
    setTimeout(() => {
        btn.classList.remove("flash");
    }, 280);
}

function userFlash(btn) {
    const color = btn.getAttribute("id");
    playTone(color, 200);
    btn.classList.add("userflash");
    setTimeout(() => {
        btn.classList.remove("userflash");
    }, 200);
}

// Unified Start Game Action
function startGame() {
    if (!started) {
        initAudio();
        started = true;
        highScoreBeaten = false;

        // UI Changes
        startBtn.innerText = "Playing...";
        startBtn.classList.add("active");
        startBtn.disabled = true;

        currentScoreEl.innerText = "0";

        levelup();
    }
}

// Play entire sequence to the user
function playSequence() {
    isComputerFlashing = true;
    document.querySelector(".gamepad").classList.add("playing-seq");
    
    let idx = 0;
    function playNext() {
        if (!started) return; // Guard if game was reset mid-play
        
        if (idx < gameSeq.length) {
            let color = gameSeq[idx];
            let btn = document.getElementById(color);
            gameFlash(btn);
            idx++;
            // Dynamically speed up delay as game levels up
            let delay = Math.max(320, 650 - (level * 25));
            setTimeout(playNext, delay);
        } else {
            isComputerFlashing = false;
            document.querySelector(".gamepad").classList.remove("playing-seq");
            statusEl.innerText = "Your turn! Repeat the pattern";
        }
    }
    
    setTimeout(playNext, 500);
}

// Check if current level is high score
function checkHighScore() {
    if (level > highScore) {
        highScore = level;
        localStorage.setItem("simonHighScore", highScore);
        highScoreEl.innerText = highScore;

        // Celebrate on first beat of this game
        if (!highScoreBeaten) {
            highScoreBeaten = true;
            triggerCelebration();
        }
    }
}

// Confetti System
function createConfetti() {
    const container = document.getElementById("confetti-container");
    container.innerHTML = ""; // Clear existing

    const colors = ["#fbbf24", "#f59e0b", "#34d399", "#10b981", "#f87171", "#ef4444", "#a78bfa", "#8b5cf6"];

    for (let i = 0; i < 60; i++) {
        const particle = document.createElement("div");
        particle.classList.add("confetti-particle");

        particle.style.left = Math.random() * 100 + "vw";
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.width = Math.random() * 6 + 6 + "px";
        particle.style.height = Math.random() * 12 + 10 + "px";

        const duration = Math.random() * 2 + 2; // 2 to 4 seconds
        particle.style.animationDuration = duration + "s";
        particle.style.animationDelay = Math.random() * 0.4 + "s";
        particle.style.transform = `rotate(${Math.random() * 360}deg)`;

        container.appendChild(particle);

        // Clean up
        setTimeout(() => {
            particle.remove();
        }, (duration + 0.5) * 1000);
    }
}

// Celebration Banner Trigger
function triggerCelebration() {
    playHighScoreSound();
    createConfetti();

    const banner = document.getElementById("celebration-banner");
    banner.classList.remove("hidden");

    setTimeout(() => {
        banner.classList.add("hidden");
    }, 3500);
}

// Level Up Logic
function levelup() {
    userSeq = [];
    level++;
    
    currentScoreEl.innerText = level;
    statusEl.innerText = `Level ${level}`;

    checkHighScore();

    let randIdx = Math.floor(Math.random() * 4);
    let randColor = btns[randIdx];
    gameSeq.push(randColor);
    
    playSequence();
}

// Handle Game Over
function gameOver() {
    playGameOverSound();
    
    statusEl.innerHTML = `Game Over! Score: <strong>${level}</strong><br>Press any key or click Start to play again.`;
    
    // Trigger CSS strobe & shake
    document.body.classList.add("game-over-active");
    setTimeout(() => {
        document.body.classList.remove("game-over-active");
    }, 350);

    reset();
}

// Answer Checker
function checkAns(idx) {
    if (userSeq[idx] === gameSeq[idx]) {
        if (userSeq.length === gameSeq.length) {
            statusEl.innerText = "Success! Watch next sequence...";
            setTimeout(levelup, 1000);
        }
    } else {
        gameOver();
    }
}

// Button Press handler
function btnPress() {
    if (!started || isComputerFlashing) return;

    let btn = this;
    userFlash(btn);

    let userColor = btn.getAttribute("id");
    userSeq.push(userColor);

    checkAns(userSeq.length - 1);
}

// Event Listeners Setup
for (let btn of allBtns) {
    btn.addEventListener("click", btnPress);
}

startBtn.addEventListener("click", startGame);

document.addEventListener("keydown", function (e) {
    // Prevent starting with modifiers or repeating keys
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    
    // Don't start game if pressing spaces on button elements (default behavior)
    if (document.activeElement === startBtn && (e.key === " " || e.key === "Enter")) {
        return;
    }
    
    startGame();
});

// Reset function
function reset() {
    started = false;
    level = 0;
    gameSeq = [];
    userSeq = [];
    isComputerFlashing = false;
    
    startBtn.innerText = "Start Game";
    startBtn.classList.remove("active");
    startBtn.disabled = false;
}