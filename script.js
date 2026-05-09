// Elemente
const startBtn = document.getElementById("start-btn");
const backBtn = document.getElementById("back-btn");
const spinBtn = document.getElementById("spin-btn");
const revealBtn = document.getElementById("reveal-btn");
const nextRoundBtn = document.getElementById("next-round-btn");
const checkLetterBtn = document.getElementById("check-letter-btn");

const letterSection = document.getElementById("letter-section");
const letterInput = document.getElementById("letter-input");

const puzzleDisplay = document.getElementById("puzzle-display");
const messageEl = document.getElementById("message");

const teamALabel = document.getElementById("teamA-label");
const teamAPlayers = document.getElementById("teamA-players-label");
const teamAScoreEl = document.getElementById("teamA-score");

const teamBLabel = document.getElementById("teamB-label");
const teamBPlayers = document.getElementById("teamB-players-label");
const teamBScoreEl = document.getElementById("teamB-score");

const roundInfo = document.getElementById("round-info");
const turnInfo = document.getElementById("turn-info");
const timerEl = document.getElementById("timer");

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

// Sunete
const tickSound = document.getElementById("tick-sound");
const spinSound = document.getElementById("spin-sound");
const dingSound = document.getElementById("ding-sound");
const failSound = document.getElementById("fail-sound");
const winSound = document.getElementById("win-sound");

// Variabile joc
let puzzles = [];
let segments = [];
let puzzle = "";
let maskedPuzzle = "";
let currentRound = 0;

let teamTurn = 0;
let scoreA = 0;
let scoreB = 0;

let currentAngle = 0;
let spinning = false;
let pendingPoints = 0;

// Legare butoane
startBtn.onclick = startGame;
backBtn.onclick = () => location.reload();
spinBtn.onclick = spinWheel;
revealBtn.onclick = revealLetter;
nextRoundBtn.onclick = nextRound;
checkLetterBtn.onclick = checkLetter;

// START JOC
function startGame() {
    puzzles = document.getElementById("puzzles-input").value
        .split("\n").map(x => x.trim()).filter(x => x.length > 0);
    segments = document.getElementById("segments-input").value
        .split(",").map(x => x.trim()).filter(x => x.length > 0);

    teamALabel.textContent = document.getElementById("teamA-name").value || "Echipa A";
    teamAPlayers.textContent = document.getElementById("teamA-players").value;

    teamBLabel.textContent = document.getElementById("teamB-name").value || "Echipa B";
    teamBPlayers.textContent = document.getElementById("teamB-players").value;

    document.getElementById("editor").style.display = "none";
    document.getElementById("game").style.display = "block";

    currentRound = 0;
    scoreA = 0;
    scoreB = 0;
    teamTurn = 0;

    loadRound();
}

function loadRound() {
    puzzle = puzzles[currentRound].toUpperCase();
    maskedPuzzle = puzzle.replace(/[A-ZĂÂÎȘȚ]/g, "_");

    puzzleDisplay.textContent = maskedPuzzle;
    roundInfo.textContent = "Runda " + (currentRound + 1);
    updateTurnInfo();
    updateScores();

    letterSection.style.display = "none";
    nextRoundBtn.style.display = "none";
    messageEl.textContent = "Învârte roata pentru a începe.";

    spinBtn.disabled = false;
    revealBtn.disabled = false;

    drawWheel();
}

function updateTurnInfo() {
    turnInfo.textContent = "Rândul: " + (teamTurn === 0 ? teamALabel.textContent : teamBLabel.textContent);
}

function updateScores() {
    teamAScoreEl.textContent = "Scor: " + scoreA;
    teamBScoreEl.textContent = "Scor: " + scoreB;
}

// DESENARE ROATĂ
function drawWheel() {
    const r = canvas.width / 2;
    const slice = 2 * Math.PI / segments.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // umbră
    ctx.save();
    ctx.translate(r, r);
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.translate(-r, -r);
    ctx.restore();

    for (let i = 0; i < segments.length; i++) {
        const start = currentAngle + i * slice;
        const end = start + slice;

        ctx.beginPath();
        ctx.moveTo(r, r);
        ctx.arc(r, r, r - 5, start, end);
        ctx.closePath();

        let grad = ctx.createRadialGradient(r, r, 10, r, r, r);
        if (i % 2 === 0) {
            grad.addColorStop(0, "#ffffff");
            grad.addColorStop(1, "#00b7ff");
        } else {
            grad.addColorStop(0, "#ffffff");
            grad.addColorStop(1, "#00ff88");
        }
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = "#222";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.save();
        ctx.translate(r, r);
        ctx.rotate(start + slice / 2);
        ctx.fillStyle = "#000";
        ctx.font = "16px Arial";
        ctx.textAlign = "right";
        ctx.fillText(segments[i], r - 15, 5);
        ctx.restore();
    }

    // cerc central
    ctx.beginPath();
    ctx.arc(r, r, 40, 0, 2 * Math.PI);
    ctx.fillStyle = "#111";
    ctx.fill();
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 3;
    ctx.stroke();
}

// ROTIRE ROATĂ
function spinWheel() {
    if (spinning) return;
    spinning = true;

    spinBtn.disabled = true;
    revealBtn.disabled = true;
    letterSection.style.display = "none";
    messageEl.textContent = "Roata se învârte...";

    // sunet continuu de spin
    try {
        spinSound.currentTime = 0;
        spinSound.loop = true;
        spinSound.play().catch(() => {});
    } catch (e) {}

    const spinTime = 3500;
    const start = performance.now();
    const startAngle = currentAngle;
    const extra = 4 + Math.random() * 3; // mai multe ture

    function anim(t) {
        const progress = (t - start) / spinTime;
        if (progress >= 1) {
            spinning = false;
            currentAngle = startAngle + extra * 2 * Math.PI;
            currentAngle %= 2 * Math.PI;
            drawWheel();
            stopTick();
            stopSpinSound();
            wheelStopAnimation();
            handleResult();
            return;
        }

        const ease = 1 - Math.pow(1 - progress, 3);
        currentAngle = startAngle + ease * extra * 2 * Math.PI;
        drawWheel();
        playTick();

        requestAnimationFrame(anim);
    }

    requestAnimationFrame(anim);
}

function stopSpinSound() {
    try {
        spinSound.pause();
        spinSound.currentTime = 0;
    } catch (e) {}
}

let lastTick = 0;
function playTick() {
    const now = performance.now();
    if (now - lastTick > 90) {
        lastTick = now;
        try {
            tickSound.currentTime = 0;
            tickSound.play().catch(() => {});
        } catch (e) {}
    }
}

function stopTick() {
    try {
        tickSound.pause();
        tickSound.currentTime = 0;
    } catch (e) {}
}

// mică animație la oprire
function wheelStopAnimation() {
    canvas.style.transition = "transform 0.12s";
    canvas.style.transform = "scale(1.05)";
    setTimeout(() => {
        canvas.style.transform = "scale(1)";
    }, 120);
}

// REZULTAT ROATĂ
function handleResult() {
    const r = canvas.width / 2;
    const slice = 2 * Math.PI / segments.length;
    const normalized = (2 * Math.PI - currentAngle + slice / 2) % (2 * Math.PI);
    const index = Math.floor(normalized / slice);
    const result = segments[index];

    // evidențiere segment câștigător (scurt)
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "yellow";
    const start = currentAngle + index * slice;
    const end = start + slice;
    ctx.beginPath();
    ctx.moveTo(r, r);
    ctx.arc(r, r, r - 5, start, end);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    if (!isNaN(parseInt(result))) {
        pendingPoints = parseInt(result);
        messageEl.textContent = "Ai nimerit " + pendingPoints + " puncte. Alege o literă!";
        letterSection.style.display = "block";
        spinBtn.disabled = true;
        revealBtn.disabled = true;
        return;
    }

    if (result.toLowerCase().includes("pierzi")) {
        messageEl.textContent = "Ai pierdut rândul!";
        try { failSound.play().catch(()=>{}); } catch(e){}
        teamTurn = 1 - teamTurn;
        updateTurnInfo();
        spinBtn.disabled = false;
        revealBtn.disabled = false;
        return;
    }

    if (result.toLowerCase().includes("bonus")) {
        const bonus = parseInt(result.replace(/\D/g, "")) || 500;
        if (teamTurn === 0) scoreA += bonus;
        else scoreB += bonus;
        updateScores();
        try { dingSound.play().catch(()=>{}); } catch(e){}
        messageEl.textContent = "BONUS +" + bonus + " puncte!";
        teamTurn = 1 - teamTurn;
        updateTurnInfo();
        spinBtn.disabled = false;
        revealBtn.disabled = false;
        return;
    }

    // fallback
    messageEl.textContent = "Rezultat necunoscut: " + result;
    spinBtn.disabled = false;
    revealBtn.disabled = false;
}

// VERIFICĂ LITERA
function checkLetter() {
    let letter = letterInput.value.toUpperCase();
    letterInput.value = "";

    if (!letter.match(/[A-ZĂÂÎȘȚ]/)) {
        messageEl.textContent = "Introdu o literă validă.";
        return;
    }

    letterSection.style.display = "none";

    let count = 0;
    for (let i = 0; i < puzzle.length; i++) {
        if (puzzle[i] === letter && maskedPuzzle[i] === "_") {
            maskedPuzzle = maskedPuzzle.substring(0, i) + letter + maskedPuzzle.substring(i + 1);
            count++;
        }
    }

    puzzleDisplay.textContent = maskedPuzzle;

    if (count > 0) {
        const total = count * pendingPoints;
        if (teamTurn === 0) scoreA += total;
        else scoreB += total;

        updateScores();
        try { dingSound.play().catch(()=>{}); } catch(e){}
        messageEl.textContent = "Litera apare de " + count + " ori. +" + total + " puncte!";

        if (maskedPuzzle === puzzle) {
            try { winSound.play().catch(()=>{}); } catch(e){}
            messageEl.textContent = "Puzzle rezolvat!";
            nextRoundBtn.style.display = "block";
            spinBtn.disabled = true;
            revealBtn.disabled = true;
            return;
        }

        spinBtn.disabled = false;
        revealBtn.disabled = false;
        return;
    }

    messageEl.textContent = "Litera nu există. Rândul trece.";
    try { failSound.play().catch(()=>{}); } catch(e){}

    teamTurn = 1 - teamTurn;
    updateTurnInfo();

    spinBtn.disabled = false;
    revealBtn.disabled = false;
}

// REVEAL LETTER – varianta A (rândul trece)
function revealLetter() {
    let hidden = [];
    for (let i = 0; i < puzzle.length; i++) {
        if (maskedPuzzle[i] === "_") hidden.push(i);
    }

    if (hidden.length === 0) return;

    let idx = hidden[Math.floor(Math.random() * hidden.length)];
    maskedPuzzle = maskedPuzzle.substring(0, idx) + puzzle[idx] + maskedPuzzle.substring(idx + 1);
    puzzleDisplay.textContent = maskedPuzzle;

    if (maskedPuzzle === puzzle) {
        try { winSound.play().catch(()=>{}); } catch(e){}
        messageEl.textContent = "Puzzle rezolvat!";
        nextRoundBtn.style.display = "block";
        spinBtn.disabled = true;
        revealBtn.disabled = true;
        return;
    }

    // după reveal → rândul trece
    teamTurn = 1 - teamTurn;
    updateTurnInfo();

    revealBtn.disabled = true;
    spinBtn.disabled = false;

    messageEl.textContent = "Ai folosit Reveal Letter. Rândul trece la cealaltă echipă.";
}

// RUNDA URMĂTOARE
function nextRound() {
    currentRound++;
    if (currentRound >= puzzles.length) {
        messageEl.textContent = "Joc terminat! Felicitări tuturor!";
        spinBtn.disabled = true;
        revealBtn.disabled = true;
        nextRoundBtn.style.display = "none";
        return;
    }
    loadRound();
}
