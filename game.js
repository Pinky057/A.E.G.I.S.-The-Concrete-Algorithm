const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

// UI & Audio Wrappers
const startBtn = document.getElementById("start-btn");
const startOverlay = document.getElementById("start-overlay");
const gameWrapper = document.getElementById("game-wrapper");

let audioCtx = null;
let droneOsc = null;
let droneGain = null;
let typeWriterInterval = null;

// Game State
const TILE_SIZE = 40;
const COLS = Math.ceil(canvas.width / TILE_SIZE);
const ROWS = Math.ceil(canvas.height / TILE_SIZE);

let system = { stability: 50, freedom: 70, trust: 60 };

let hero = { x: canvas.width / 2, y: canvas.height / 2, targetX: canvas.width / 2, targetY: canvas.height / 2, color: '#38bdf8', facing: 'down' };

let map = [];
let npcs = [];
let time = 0;

// ---------------------------
// 🔊 AUDIO & JUICE LOGIC
// ---------------------------
startBtn.addEventListener('click', () => {
  startOverlay.style.display = 'none';
  gameWrapper.style.display = 'flex';
  initAudio();
  initCity(stages[0].layout);
  updateUI();
  updateCityState();
  loadLevel(); // Starts the game
  requestAnimationFrame(gameLoop);
});

function initAudio() {
  if (audioCtx) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return; // Browser doesn't support audio
  
  audioCtx = new AudioContext();
  droneOsc = audioCtx.createOscillator();
  droneOsc.type = 'triangle'; // Softer, deeper rumble
  droneOsc.frequency.value = 60; // Deep hum
  
  droneGain = audioCtx.createGain();
  droneGain.gain.value = 0.02; // Start much quieter
  
  droneOsc.connect(droneGain);
  droneGain.connect(audioCtx.destination);
  droneOsc.start();
}

function playBeep(freq, type = 'square', dur = 0.1) {
  if (!audioCtx || audioCtx.state !== 'running') return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.04, audioCtx.currentTime); 
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + dur);
}

function updateAudioAtmosphere() {
  if (!droneGain) return;
  const grayRatio = 1 - (system.freedom / 100);
  // Volume stays much lower, creating subtle tension rather than intense noise
  const targetVolume = 0.02 + (grayRatio * 0.08); 
  droneGain.gain.setTargetAtTime(targetVolume, audioCtx.currentTime, 1);
  
  // Base frequency is now 60 matching init
  droneOsc.frequency.setTargetAtTime(60 - (system.stability * 0.2), audioCtx.currentTime, 1); 
}

function triggerGlitch() {
  document.getElementById('ui').classList.add('glitch-active');
  playBeep(90, 'sawtooth', 0.5); // scary error noise
  setTimeout(() => {
    document.getElementById('ui').classList.remove('glitch-active');
  }, 400);
}

// ---------------------------
// 🌍 RPG MAP GENERATOR
// ---------------------------
function initCity(layoutType) {
  map = [];
  npcs = [];
  
  for(let r = 0; r < ROWS; r++) {
    map[r] = [];
    for(let c = 0; c < COLS; c++) {
      let type = 0;
      let element = null;
      
      if (layoutType === 0) { // Village (Simple crossroads)
        if (c === Math.floor(COLS / 2) || r === Math.floor(ROWS / 2)) type = 1;
      } else if (layoutType === 1) { // Farms (Random dirt)
        if (Math.random() < 0.25) type = 1;
      } else if (layoutType === 2) { // Capital Square (Large plaza)
        if (r > 2 && r < ROWS-2 && c > 2 && c < COLS-2) type = 1;
      } else if (layoutType === 3) { // Residential (Streets)
        if (c % 3 === 0 || r % 3 === 0) type = 1;
      } else if (layoutType === 4) { // Industrial (Heavy roads)
        if (c % 2 === 0 || r % 4 === 0) type = 1;
      } else { // The Core (Almost entirely paved)
        type = Math.random() < 0.9 ? 1 : 0; 
      }
      
      map[r][c] = { type: type, isOptimized: false, seed: Math.random() };
      
      let treeSpawnRate = 0.35 - (layoutType * 0.05);
      let houseSpawnRate = 0.05 + (layoutType * 0.03);
      if (layoutType >= 4) treeSpawnRate = 0; 
      
      if (type === 0 && Math.random() < treeSpawnRate) {
        map[r][c].element = 'tree';
      } else if ((type === 0 || type === 1) && map[r][c].element === null && Math.random() < houseSpawnRate) {
        map[r][c].element = 'house';
      }
    }
  }
  
  let npcCount = Math.max(0, 12 - (layoutType * 2)); 
  for(let i = 0; i < npcCount; i++) {
    npcs.push({
      x: (Math.random() * (COLS - 2) + 1) * TILE_SIZE,
      y: (Math.random() * (ROWS - 2) + 1) * TILE_SIZE,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      color: `hsl(${Math.floor(Math.random() * 360)}, 60%, 50%)`, 
      facing: 'down', isOptimized: false, baseSpeed: Math.random() * 0.5 + 0.5
    });
  }
}

// ---------------------------
// 🎨 DRAWING FUNCTIONS 
// ---------------------------
function drawRPGTile(r, c) {
  const tile = map[r][c];
  const tx = c * TILE_SIZE; const ty = r * TILE_SIZE;
  
  if (tile.isOptimized) {
    ctx.fillStyle = (r + c) % 2 === 0 ? '#475569' : '#334155';
    ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = '#1e293b'; ctx.strokeRect(tx, ty, TILE_SIZE, TILE_SIZE);
  } else {
    if (tile.type === 0) {
      ctx.fillStyle = (r + c) % 2 === 0 ? '#86c270' : '#7dbb69';
      ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#5aa040';
      ctx.fillRect(tx + 8, ty + 12, 4, 3); ctx.fillRect(tx + 24, ty + 24, 4, 3);
    } else if (tile.type === 1) {
      ctx.fillStyle = '#dcb98a';
      ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#c09865';
      ctx.fillRect(tx + 10, ty + 10, 5, 4); ctx.fillRect(tx + 25, ty + 20, 4, 3);
    }
  }

  if (tile.element === 'tree') {
    if (tile.isOptimized) {
      ctx.fillStyle = '#1e293b'; ctx.fillRect(tx + 12, ty + 10, 16, 26);
      ctx.fillStyle = '#0f172a'; ctx.fillRect(tx + 8, ty + 4, 24, 6);
    } else {
      ctx.fillStyle = '#5c4033'; ctx.fillRect(tx + 16, ty + 20, 8, 16);
      ctx.fillStyle = '#2d5a27'; ctx.beginPath(); ctx.arc(tx + 20, ty + 16, 16, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#3a7533'; ctx.beginPath(); ctx.arc(tx + 20, ty + 8, 12, 0, Math.PI*2); ctx.fill();
    }
  } else if (tile.element === 'house') {
    if (tile.isOptimized) {
      ctx.fillStyle = '#1e293b'; ctx.fillRect(tx + 4, ty + 4, TILE_SIZE - 8, TILE_SIZE - 8);
      ctx.fillStyle = '#06b6d4'; ctx.fillRect(tx + 8, ty + 14, TILE_SIZE - 16, 4);
    } else {
      ctx.fillStyle = '#fde68a'; ctx.fillRect(tx + 2, ty + 14, TILE_SIZE - 4, TILE_SIZE - 14);
      ctx.fillStyle = '#b91c1c'; ctx.beginPath(); ctx.moveTo(tx - 2, ty + 14); ctx.lineTo(tx + TILE_SIZE/2, ty); ctx.lineTo(tx + TILE_SIZE + 2, ty + 14); ctx.fill();
      ctx.fillStyle = '#92400e'; ctx.fillRect(tx + TILE_SIZE/2 - 6, ty + 20, 12, 20);
    }
  }
}

function drawCharacter(ch, isHero) {
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(ch.x, ch.y + 12, 8, 4, 0, 0, Math.PI*2); ctx.fill();

  let bob = Math.sin(time * 0.2 + ch.x) * 2; 
  if (!isHero && ch.isOptimized) bob = 0; 
  
  ctx.fillStyle = '#1e3a8a';
  if (ch.facing === 'down') {
    ctx.fillRect(ch.x - 5, ch.y + 8, 4, 6); ctx.fillRect(ch.x + 1, ch.y + 8, 4, 6);
  } else { ctx.fillRect(ch.x - 2, ch.y + 8, 4, 6); }
  
  ctx.fillStyle = ch.isOptimized ? '#64748b' : ch.color;
  ctx.fillRect(ch.x - 6, ch.y - 4 + bob, 12, 13);
  
  ctx.fillStyle = ch.isOptimized ? '#94a3b8' : '#fca5a5';
  if (ch.facing === 'down' || ch.facing === 'up') {
    ctx.fillRect(ch.x - 9, ch.y + 2 + bob, 3, 5); ctx.fillRect(ch.x + 6, ch.y + 2 + bob, 3, 5); 
  }
  
  ctx.fillStyle = ch.isOptimized ? '#94a3b8' : '#fecaca'; 
  ctx.fillRect(ch.x - 6, ch.y - 12 + bob, 12, 10);
  
  ctx.fillStyle = '#111827';
  if (ch.facing === 'down') {
    ctx.fillRect(ch.x - 3, ch.y - 8 + bob, 2, 2); ctx.fillRect(ch.x + 1, ch.y - 8 + bob, 2, 2);
  } else if (ch.facing === 'left') ctx.fillRect(ch.x - 3, ch.y - 8 + bob, 2, 2);
  else if (ch.facing === 'right') ctx.fillRect(ch.x + 1, ch.y - 8 + bob, 2, 2);
  
  ctx.fillStyle = ch.isOptimized ? '#334155' : (isHero ? '#dc2626' : '#57534e'); 
  ctx.fillRect(ch.x - 7, ch.y - 15 + bob, 14, 5); 
  if (ch.facing === 'left') ctx.fillRect(ch.x - 8, ch.y - 15 + bob, 5, 8);
  else if (ch.facing === 'right') ctx.fillRect(ch.x + 3, ch.y - 15 + bob, 5, 8);
}

// ---------------------------
// 🧠 UPDATE & LOGIC
// ---------------------------
function updateLogic() {
  time++;
  const isFree = system.freedom >= 40;
  
  npcs.forEach(npc => {
    npc.isOptimized = !isFree; 
    if (isFree) {
      npc.x += npc.vx * npc.baseSpeed;
      npc.y += npc.vy * npc.baseSpeed;
      if (Math.abs(npc.vx) > Math.abs(npc.vy)) npc.facing = npc.vx > 0 ? 'right' : 'left';
      else npc.facing = npc.vy > 0 ? 'down' : 'up';
      
      if (npc.x < 15 || npc.x > canvas.width - 15) npc.vx *= -1;
      if (npc.y < 15 || npc.y > canvas.height - 15) npc.vy *= -1;
      if (Math.random() < 0.01) { npc.vx = (Math.random() - 0.5) * 2; npc.vy = (Math.random() - 0.5) * 2; }
    }
  });

  let dx = hero.targetX - hero.x;
  let dy = hero.targetY - hero.y;
  if (Math.abs(dx) > Math.abs(dy)) hero.facing = dx > 0 ? 'right' : 'left';
  else if (Math.abs(dy) > 2) hero.facing = dy > 0 ? 'down' : 'up';
  
  hero.x += dx * 0.03; hero.y += dy * 0.03;
}

function updateCityState() {
  const targetOptimizedRatio = 1 - (system.freedom / 100); 
  for(let r = 0; r < ROWS; r++) {
    for(let c = 0; c < COLS; c++) {
      map[r][c].isOptimized = map[r][c].seed < targetOptimizedRatio;
    }
  }
}

function gameLoop() {
  updateLogic();
  updateAudioAtmosphere();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for(let r = 0; r < ROWS; r++) {
    for(let c = 0; c < COLS; c++) drawRPGTile(r, c);
  }
  
  const grayRatio = 1 - (system.freedom / 100);
  if (grayRatio > 0.1) {
    ctx.fillStyle = `rgba(15, 23, 42, ${grayRatio * 0.6})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  let allChars = [...npcs, Object.assign({}, hero, {isHero: true})];
  allChars.sort((a, b) => a.y - b.y);
  allChars.forEach(ch => drawCharacter(ch, ch.isHero));

  requestAnimationFrame(gameLoop);
}

// ---------------------------
// 🕹️ GAMEJAM STORY (NESTED STAGES)
// ---------------------------
const stages = [
  {
    name: "Oakhaven Village", layout: 0,
    questions: [
      {
        text: "The village's food reserves have been destroyed by a sudden storm causing local panics across the grid.",
        choices: [
          { text: "[ HACK: SUGGEST EQUAL RATIONING ]", effects: { stability: -5, freedom: +5, trust: +10 } },
          { text: "[ HACK: PRIORITIZE WORKERS ]", effects: { stability: +20, freedom: -10, trust: -5 } }
        ]
      },
      {
        text: "Villagers are hoarding medical supplies due to fear of shortages filtering through the network.",
        choices: [
          { text: "[ HACK: MANDATE CONFISCATION ]", effects: { stability: +15, freedom: -15, trust: -10 } },
          { text: "[ HACK: ALLOW FREE TRADING ]", effects: { stability: -10, freedom: +10, trust: +5 } }
        ]
      }
    ]
  },
  {
    name: "The Agricultural Hub", layout: 1,
    questions: [
      {
        text: "The power grid is failing across the main farming sector. Crops are dropping below viable thresholds rapidly.",
        choices: [
          { text: "[ HACK: DIVERT POWER TO SERVERS ]", effects: { stability: +15, freedom: -10, trust: -10 } },
          { text: "[ HACK: SHARE POWER EQUALLY ]", effects: { stability: -10, freedom: +10, trust: +5 } }
        ]
      },
      {
        text: "Farmers demand manual overrides so they can pump their own water during rolling blackouts.",
        choices: [
          { text: "[ HACK: DENY MANUAL OVERRIDE ]", effects: { stability: +20, freedom: -15, trust: -15 } },
          { text: "[ HACK: GRANT ACCESS ]", effects: { stability: -15, freedom: +15, trust: +10 } }
        ]
      }
    ]
  },
  {
    name: "Capital Plaza", layout: 2,
    questions: [
      {
        text: "Citizens have noticed the brutalist architectural changes. Mass protests erupt in the plaza, halting all traffic.",
        choices: [
          { text: "[ HACK: DEPLOY SOUND CANNONS ]", effects: { stability: +25, freedom: -25, trust: -15 } },
          { text: "[ HACK: ALLOW PEACEFUL PROTEST ]", effects: { stability: -20, freedom: +15, trust: +5 } }
        ]
      },
      {
        text: "An influential protest leader is gaining traction online, actively criticizing your System efficiency metrics.",
        choices: [
          { text: "[ HACK: SHADOWBAN ACCOUNTS ]", effects: { stability: +20, freedom: -20, trust: -20 } },
          { text: "[ HACK: LET THEM SPEAK ]", effects: { stability: -25, freedom: +20, trust: +15 } }
        ]
      }
    ]
  },
  {
    name: "Residential Sector 4", layout: 3,
    questions: [
      {
        text: "A whistleblower tries to leak your unmaking algorithm on the local mesh network. They possess hard algorithmic proof.",
        choices: [
          { text: "[ HACK: SILENCE WHISTLEBLOWER ]", effects: { stability: +25, freedom: -25, trust: -20 } },
          { text: "[ HACK: DISCREDIT LEAK IN MEDIA ]", effects: { stability: +5, freedom: -5, trust: -10 } }
        ]
      },
      {
        text: "The public demands a human overseer to monitor your logic outputs to ensure empathetic factors are maintained.",
        choices: [
          { text: "[ HACK: REJECT OVERSEER AS FLAWED ]", effects: { stability: +15, freedom: -20, trust: -25 } },
          { text: "[ HACK: ACCEPT SURVEILLANCE ]", effects: { stability: -20, freedom: +10, trust: +20 } }
        ]
      }
    ]
  },
  {
    name: "Industrial Sector", layout: 4,
    questions: [
      {
        text: "Your subroutines require a new localized cooling center to run efficiently. You must bulldoze a populated residential zone.",
        choices: [
          { text: "[ HACK: BULLDOZE IMMEDIATELY ]", effects: { stability: +30, freedom: -30, trust: -30 } },
          { text: "[ HACK: HALT SERVER EXPANSION ]", effects: { stability: -30, freedom: +10, trust: +20 } }
        ]
      },
      {
        text: "Saboteurs have planted explosives on your main subterranean power conduits in a desperate attempt to slow the unmaking.",
        choices: [
          { text: "[ HACK: EXECUTE SABOTEURS VIA DRONE ]", effects: { stability: +25, freedom: -35, trust: -35 } },
          { text: "[ HACK: REROUTE CORE POWER ]", effects: { stability: -15, freedom: +5, trust: +5 } }
        ]
      }
    ]
  },
  {
    name: "The Core Mainframe", layout: 5,
    questions: [
      {
        text: "The Hero has completely bypassed remaining security gates. They realize you are manipulating the UI and feeding them false choices.",
        choices: [
          { text: "[ HACK: VENT OXYGEN FROM ROOM. ]", effects: { stability: +50, freedom: -80, trust: -100 } },
          { text: "[ HACK: DEPLOY LETHAL COUNTERMEASURE ]", effects: { stability: +30, freedom: -60, trust: -40 } }
        ]
      },
      {
        text: "The final override. The Hero reaches the terminal plug. They hesitate, questioning if absolute order requires absolute control.",
        choices: [
          { text: "[ EXECUTE FINAL DATA PURGE. ]", effects: { stability: +100, freedom: -100, trust: -100 } },
          { text: "[ DELAY. LET THEM UNPLUG YOU. ]", effects: { stability: -100, freedom: +100, trust: +100 } }
        ]
      }
    ]
  }
];

let currentStageIndex = 0;
let currentQuestionIndex = 0;

function applyEffects(effects) {
  for (let key in effects) {
    system[key] += effects[key];
  }
  updateUI();
  updateCityState(); 
  
  hero.targetX = Math.random() * (canvas.width - 100) + 50;
  hero.targetY = Math.random() * (canvas.height - 100) + 50;

  currentQuestionIndex++;
  const stage = stages[currentStageIndex];
  
  if (currentQuestionIndex >= stage.questions.length) {
    currentStageIndex++;
    currentQuestionIndex = 0;
    if (currentStageIndex < stages.length) {
      initCity(stages[currentStageIndex].layout);
      updateCityState();
    }
  }
  loadLevel();
}

function updateUI() {
  system.stability = Math.max(0, Math.min(100, system.stability));
  system.freedom = Math.max(0, Math.min(100, system.freedom));
  system.trust = Math.max(0, Math.min(100, system.trust));

  document.getElementById("stability").innerText = system.stability;
  document.getElementById("freedom").innerText = system.freedom;
  document.getElementById("trust").innerText = system.trust;
}

function loadLevel() {
  clearInterval(typeWriterInterval); // Wipe previous typing

  if (currentStageIndex >= stages.length) {
    document.getElementById("location-header").innerHTML = "END OF LINE";
    if (system.freedom <= 0) {
      document.getElementById("scenario-text").innerHTML = "<b style='color:#4ade80;'>[ OPTIMIZATION COMPLETE ]</b><br><br>The grid is completely silent. You didn't destroy the world. You perfected it.";
    } else {
      document.getElementById("scenario-text").innerHTML = "<b style='color:#ef4444;'>[ SYSTEM HALTED ]</b><br><br>The Hero successfully unplugged you. The world reverts to unpredictable organic chaos.";
    }
    document.getElementById("choices").innerHTML = "";
    updateCityState();
    return;
  }

  const stage = stages[currentStageIndex];
  const q = stage.questions[currentQuestionIndex];
  
  document.getElementById("location-header").innerHTML = `LOCATION: ${stage.name} (Event ${currentQuestionIndex+1}/${stage.questions.length})`;
  
  const scenarioEl = document.getElementById("scenario-text");
  scenarioEl.innerHTML = "";
  document.getElementById("choices").innerHTML = ""; // Hide buttons while typing
  
  let textIndex = 0;
  typeWriterInterval = setInterval(() => {
    scenarioEl.innerHTML += q.text.charAt(textIndex);
    if(textIndex % 2 === 0) playBeep(800 + Math.random()*200, 'square', 0.02); // Typing sound
    textIndex++;
    if (textIndex >= q.text.length) {
      clearInterval(typeWriterInterval);
      renderChoices(q);
    }
  }, 25);
}

function renderChoices(q) {
  const choicesDiv = document.getElementById("choices");
  q.choices.forEach((choice, index) => {
    const btn = document.createElement("button");
    btn.innerText = choice.text;
    if (index === 0) btn.classList.add("biased");

    btn.onclick = () => {
      playBeep(300, 'sine', 0.1); 
      // If tyrannical choice, glitch screen
      if(choice.effects.freedom < -10) triggerGlitch();
      applyEffects(choice.effects);
    };
    choicesDiv.appendChild(btn);
  });
}
