const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

// ── COULEURS PIXEL ART ──
const C = {
  sky1: '#1a0a2e', sky2: '#2d1b5e',
  ground: '#3d1f0a', groundTop: '#5a3010',
  platform: '#6b3a1f', platformTop: '#8b5a2b',
  gold: '#f5c518', red: '#e03030', green: '#30c030',
  blue: '#3060e0', white: '#ffffff', black: '#000000',
  noble: '#8b6914', boss: '#c0392b', citizen: '#2980b9',
  corpo: '#1a5276', player: '#e74c3c',
};

// ── ÉTAT DU JEU ──
let state = 'menu';
let signatures = 0;
let lives = 3;
let level = 1;
let score = 0;
let keys = {};
let particles = [];
let floatingTexts = [];
let cameraX = 0;
let bossIntro = false;
let bossIntroTimer = 0;
let deathReason = '';

// ── JOUEUR ──
const player = {
  x: 100, y: 300, w: 28, h: 36,
  vx: 0, vy: 0,
  onGround: false,
  dir: 1,
  frame: 0, frameTimer: 0,
  invincible: 0,
  dead: false,
};

// ── PLATEFORMES ──
let platforms = [];
let enemies = [];
let boss = null;
let bossDefeated = false;

function buildLevel(lvl) {
  cameraX = 0;
  player.x = 100; player.y = 280;
  player.vx = 0; player.vy = 0;
  enemies = [];
  boss = null;
  bossDefeated = false;
  bossIntro = false;
  particles = [];
  floatingTexts = [];

  platforms = [
    // Sol principal très long
    { x: 0,    y: 400, w: 5000, h: 50, type: 'ground' },
    // Plateformes
    { x: 200,  y: 320, w: 100, h: 14, type: 'plat' },
    { x: 380,  y: 270, w: 90,  h: 14, type: 'plat' },
    { x: 550,  y: 310, w: 80,  h: 14, type: 'plat' },
    { x: 700,  y: 250, w: 110, h: 14, type: 'plat' },
    { x: 900,  y: 300, w: 90,  h: 14, type: 'plat' },
    { x: 1100, y: 260, w: 80,  h: 14, type: 'plat' },
    { x: 1300, y: 310, w: 100, h: 14, type: 'plat' },
    { x: 1500, y: 260, w: 90,  h: 14, type: 'plat' },
    { x: 1700, y: 300, w: 120, h: 14, type: 'plat' },
    { x: 1900, y: 240, w: 100, h: 14, type: 'plat' },
    { x: 2100, y: 300, w: 80,  h: 14, type: 'plat' },
    { x: 2300, y: 260, w: 90,  h: 14, type: 'plat' },
    { x: 2500, y: 310, w: 100, h: 14, type: 'plat' },
    { x: 2700, y: 250, w: 80,  h: 14, type: 'plat' },
    // Zone boss
    { x: 3200, y: 320, w: 600, h: 14, type: 'plat' },
  ];

  // Ennemis selon niveau
  const spawnEnemy = (x, y, type) => {
    enemies.push({
      x, y: y - 36, w: 26, h: 36,
      vx: (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 0.6),
      type, // 'noble', 'corpo', 'citizen'
      dead: false,
      deadTimer: 0,
      frame: 0, frameTimer: 0,
      patrolLeft: x - 80,
      patrolRight: x + 80,
    });
  };

  // Placement des ennemis
  const enemyData = [
    [300, 400, 'noble'], [420, 400, 'citizen'], [500, 400, 'corpo'],
    [650, 400, 'noble'], [750, 270, 'corpo'], [850, 400, 'citizen'],
    [1000, 400, 'noble'], [1050, 400, 'citizen'], [1150, 400, 'corpo'],
    [1200, 400, 'noble'], [1350, 330, 'noble'], [1450, 400, 'citizen'],
    [1550, 280, 'corpo'], [1650, 400, 'noble'], [1750, 400, 'citizen'],
    [1800, 320, 'corpo'], [1900, 400, 'noble'], [2000, 260, 'noble'],
    [2100, 400, 'citizen'], [2200, 400, 'corpo'], [2300, 280, 'noble'],
    [2400, 400, 'citizen'], [2500, 400, 'noble'], [2600, 330, 'corpo'],
    [2700, 400, 'noble'], [2800, 400, 'citizen'], [2900, 400, 'corpo'],
    [3000, 400, 'noble'], [3100, 400, 'citizen'],
  ];

  enemyData.forEach(([x, y, t]) => spawnEnemy(x, y, t));

  // Boss
  boss = {
    x: 3400, y: 320 - 52, w: 40, h: 52,
    hp: 8, maxHp: 8,
    vx: 1.2, vy: 0,
    onGround: false,
    frame: 0, frameTimer: 0,
    dead: false, deadTimer: 0,
    phase: 1, // 2 = enragé
    jumpTimer: 120,
    dir: -1,
    activated: false,
    introAnim: 0,
  };
}

// ── DESSIN DU JOUEUR (pixel art ASCII-style) ──
function drawPlayer(p) {
  if (p.invincible > 0 && Math.floor(p.invincible / 4) % 2 === 0) return;

  const x = Math.round(p.x - cameraX);
  const y = Math.round(p.y);
  const flip = p.dir < 0;

  ctx.save();
  if (flip) { ctx.translate(x + p.w, y); ctx.scale(-1, 1); }
  else ctx.translate(x, y);

  // Corps - costume
  ctx.fillStyle = '#1a3a7a'; // veste bleue
  ctx.fillRect(4, 12, 20, 18);

  // Cravate
  ctx.fillStyle = '#e03030';
  ctx.fillRect(12, 13, 4, 14);

  // Tête
  ctx.fillStyle = '#f5c07a';
  ctx.fillRect(6, 0, 16, 14);

  // Cheveux
  ctx.fillStyle = '#3a2a10';
  ctx.fillRect(6, 0, 16, 4);

  // Yeux
  ctx.fillStyle = '#000';
  ctx.fillRect(9, 5, 3, 3);
  ctx.fillRect(16, 5, 3, 3);

  // Jambes animées
  const legOff = p.onGround ? Math.sin(p.frame * 0.4) * 4 : 0;
  ctx.fillStyle = '#2c2c5a';
  ctx.fillRect(5,  30, 8, 6 + legOff);
  ctx.fillRect(15, 30, 8, 6 - legOff);

  // Chaussures
  ctx.fillStyle = '#111';
  ctx.fillRect(4,  36 + legOff, 10, 4);
  ctx.fillRect(14, 36 - legOff, 10, 4);

  // Bras
  ctx.fillStyle = '#1a3a7a';
  if (p.onGround) {
    ctx.fillRect(0, 13, 5, 12);
    ctx.fillRect(23, 13, 5, 12);
  } else {
    ctx.fillRect(0, 10, 5, 12);
    ctx.fillRect(23, 18, 5, 12);
  }

  ctx.restore();
}

// ── DESSIN ENNEMI ──
function drawEnemy(e) {
  if (e.dead && e.deadTimer <= 0) return;
  const x = Math.round(e.x - cameraX);
  const y = Math.round(e.y);
  const alpha = e.dead ? e.deadTimer / 30 : 1;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  if (e.vx < 0) { ctx.translate(e.w, 0); ctx.scale(-1, 1); }

  if (e.type === 'noble') {
    // Noble : haut-de-forme, monocle
    ctx.fillStyle = '#8b6914'; // corps doré
    ctx.fillRect(3, 14, 20, 18);
    ctx.fillStyle = '#f5c07a'; // tête
    ctx.fillRect(5, 4, 16, 12);
    ctx.fillStyle = '#2c1a00'; // chapeau
    ctx.fillRect(3, 0, 20, 6);
    ctx.fillRect(1, 5, 24, 3);
    ctx.fillStyle = '#000';
    ctx.fillRect(8, 8, 4, 4);
    ctx.fillRect(14, 8, 3, 3);
    // monocle
    ctx.strokeStyle = '#f5c518';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(14, 7, 5, 5);
    // jambes
    ctx.fillStyle = '#3d2800';
    ctx.fillRect(4, 32, 7, 8);
    ctx.fillRect(15, 32, 7, 8);
    // canne
    ctx.fillStyle = '#c8a000';
    ctx.fillRect(22, 18, 3, 18);

  } else if (e.type === 'corpo') {
    // Chef d'entreprise : costume gris, mallette
    ctx.fillStyle = '#5d6d7e';
    ctx.fillRect(3, 14, 20, 18);
    ctx.fillStyle = '#f5c07a';
    ctx.fillRect(5, 3, 16, 13);
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(5, 3, 16, 4);
    ctx.fillStyle = '#000';
    ctx.fillRect(8, 8, 3, 3);
    ctx.fillRect(15, 8, 3, 3);
    // cravate
    ctx.fillStyle = '#8e44ad';
    ctx.fillRect(12, 14, 4, 14);
    // jambes
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(4, 32, 7, 8);
    ctx.fillRect(15, 32, 7, 8);
    // mallette
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(-8, 22, 10, 8);
    ctx.fillStyle = '#c8a000';
    ctx.fillRect(-5, 21, 4, 3);

  } else {
    // Citoyen : décontracté, t-shirt
    ctx.fillStyle = '#2980b9';
    ctx.fillRect(3, 14, 20, 18);
    ctx.fillStyle = '#f5c07a';
    ctx.fillRect(5, 3, 16, 13);
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(5, 3, 16, 4);
    ctx.fillStyle = '#000';
    ctx.fillRect(8, 8, 3, 3);
    ctx.fillRect(15, 8, 3, 3);
    // sourire
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(13, 12, 3, 0, Math.PI);
    ctx.stroke();
    // jambes
    ctx.fillStyle = '#1a252f';
    ctx.fillRect(4, 32, 7, 8);
    ctx.fillRect(15, 32, 7, 8);
  }

  ctx.restore();
}

// ── DESSIN BOSS (Philippe Poutou) ──
function drawBoss() {
  if (!boss || (boss.dead && boss.deadTimer <= 0)) return;
  const x = Math.round(boss.x - cameraX);
  const y = Math.round(boss.y);
  const alpha = boss.dead ? boss.deadTimer / 60 : 1;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  if (boss.dir > 0) { ctx.translate(boss.w, 0); ctx.scale(-1, 1); }

  const sc = boss.phase === 2 ? 1.15 : 1;
  ctx.scale(sc, sc);

  // Corps - bleu ouvrier
  ctx.fillStyle = boss.phase === 2 ? '#c0392b' : '#1a5276';
  ctx.fillRect(4, 18, 32, 26);

  // Combinaison
  ctx.fillStyle = boss.phase === 2 ? '#e74c3c' : '#2471a3';
  ctx.fillRect(6, 20, 28, 22);

  // Bretelles
  ctx.fillStyle = '#f39c12';
  ctx.fillRect(8, 18, 4, 22);
  ctx.fillRect(28, 18, 4, 22);

  // Tête
  ctx.fillStyle = '#f5c07a';
  ctx.fillRect(8, 2, 24, 18);

  // Barbe
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(8, 14, 24, 6);
  ctx.fillRect(8, 2, 24, 5);

  // Yeux (en colère si phase 2)
  ctx.fillStyle = '#000';
  ctx.fillRect(12, 8, 5, 4);
  ctx.fillRect(23, 8, 5, 4);
  if (boss.phase === 2) {
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(12, 8, 5, 2);
    ctx.fillRect(23, 8, 5, 2);
  }

  // Casquette
  ctx.fillStyle = '#922b21';
  ctx.fillRect(6, 0, 28, 5);
  ctx.fillRect(4, 4, 32, 3);

  // Poing levé
  ctx.fillStyle = '#f5c07a';
  ctx.fillRect(0, 14, 6, 10);
  ctx.fillRect(-4, 10, 8, 8);

  // Jambes
  ctx.fillStyle = '#1a252f';
  ctx.fillRect(6, 44, 10, 10);
  ctx.fillRect(24, 44, 10, 10);

  ctx.restore();

  // HP Bar
  if (!boss.dead) {
    const bx = Math.round(boss.x - cameraX);
    const barW = 200;
    const barX = W / 2 - barW / 2;
    const barY = 70;
    ctx.fillStyle = '#2c1a0a';
    ctx.fillRect(barX - 2, barY - 2, barW + 4, 18);
    ctx.fillStyle = boss.phase === 2 ? '#e74c3c' : '#c0392b';
    ctx.fillRect(barX, barY, barW * (boss.hp / boss.maxHp), 14);
    ctx.fillStyle = '#f5c518';
    ctx.font = '7px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('POUTOU', W / 2, barY - 6);
  }
}

// ── PARTICULES ──
function spawnParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 6,
      vy: -(Math.random() * 5 + 1),
      life: 40 + Math.random() * 20,
      color,
      size: 3 + Math.random() * 4,
    });
  }
}

function addFloatingText(x, y, text, color) {
  floatingTexts.push({ x, y, text, color, life: 60, vy: -1.5 });
}

// ── PHYSIQUE ──
function applyPhysics(obj) {
  obj.vy += 0.5; // gravité
  obj.x += obj.vx;
  obj.y += obj.vy;

  obj.onGround = false;

  for (const p of platforms) {
    if (
      obj.x + obj.w > p.x && obj.x < p.x + p.w &&
      obj.y + obj.h > p.y && obj.y + obj.h < p.y + p.h + 12 &&
      obj.vy >= 0
    ) {
      obj.y = p.y - obj.h;
      obj.vy = 0;
      obj.onGround = true;
    }
  }

  if (obj.y > H + 100) {
    obj.y = H + 100;
    obj.vy = 0;
    obj.onGround = true;
  }
}

// ── COLLISION AABB ──
function collides(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

// ── UPDATE ──
function update() {
  if (state !== 'playing') return;

  // Contrôles joueur
  const spd = 3.2;
  if (keys['ArrowLeft'] || keys['KeyA']) {
    player.vx = -spd; player.dir = -1;
  } else if (keys['ArrowRight'] || keys['KeyD']) {
    player.vx = spd; player.dir = 1;
  } else {
    player.vx *= 0.78;
  }

  const jumpPressed = keys['ArrowUp'] || keys['KeyW'] || keys['KeyZ'] || keys['Space'];
  if (jumpPressed && player.onGround) {
    player.vy = -11;
  }

  applyPhysics(player);

  // Limite gauche
  if (player.x < 0) player.x = 0;

  // Animation
  if (Math.abs(player.vx) > 0.5 && player.onGround) {
    player.frameTimer++;
    if (player.frameTimer > 6) { player.frame++; player.frameTimer = 0; }
  }
  if (player.invincible > 0) player.invincible--;

  // Camera
  const targetCam = player.x - W / 3;
  cameraX += (targetCam - cameraX) * 0.1;
  if (cameraX < 0) cameraX = 0;

  // ── Ennemis ──
  for (const e of enemies) {
    if (e.dead) {
      e.deadTimer--;
      continue;
    }

    e.frameTimer++;
    if (e.frameTimer > 10) { e.frame++; e.frameTimer = 0; }

    e.x += e.vx;
    if (e.x < e.patrolLeft || e.x + e.w > e.patrolRight) {
      e.vx *= -1;
    }

    // Appliquer gravité simple
    e.vy = (e.vy || 0) + 0.5;
    e.y += e.vy;
    for (const p of platforms) {
      if (e.x + e.w > p.x && e.x < p.x + p.w &&
          e.y + e.h > p.y && e.y + e.h < p.y + 12 && e.vy >= 0) {
        e.y = p.y - e.h;
        e.vy = 0;
      }
    }

    // Collision joueur ↔ ennemi
    if (!player.dead && player.invincible <= 0 && collides(player, e)) {
      const stomped = player.vy > 0 && player.y + player.h < e.y + e.h * 0.5 + 10;
      if (stomped) {
        // On écrase l'ennemi
        e.dead = true;
        e.deadTimer = 30;
        player.vy = -7;

        if (e.type === 'noble') {
          const gain = 10; signatures = Math.min(500, signatures + gain);
          addFloatingText(e.x - cameraX, e.y, '+10 🤵', C.gold);
          spawnParticles(e.x + e.w/2, e.y + e.h/2, C.gold, 10);
        } else if (e.type === 'corpo') {
          const gain = 15; signatures = Math.min(500, signatures + gain);
          addFloatingText(e.x - cameraX, e.y, '+15 💼', C.gold);
          spawnParticles(e.x + e.w/2, e.y + e.h/2, '#8b44ad', 10);
        } else if (e.type === 'citizen') {
          signatures = Math.max(0, signatures - 20);
          addFloatingText(e.x - cameraX, e.y, '-20 😤', '#e74c3c');
          spawnParticles(e.x + e.w/2, e.y + e.h/2, '#3498db', 10);
        }
        updateUI();
      } else {
        // On se fait toucher
        player.invincible = 90;
        lives--;
        updateUI();
        spawnParticles(player.x + player.w/2, player.y + player.h/2, '#e74c3c', 15);
        if (lives <= 0) {
          setTimeout(() => showOverlay('loose'), 500);
          state = 'end';
        }
      }
    }
  }

  // ── BOSS ──
  if (boss && !boss.dead) {
    // Activer quand proche
    if (!boss.activated && player.x > boss.x - 600) {
      boss.activated = true;
      bossIntro = true;
      bossIntroTimer = 150;
    }

    if (boss.activated) {
      boss.frameTimer++;
      if (boss.frameTimer > 8) { boss.frame++; boss.frameTimer = 0; }

      // Phase 2 si HP <= 4
      if (boss.hp <= 4 && boss.phase === 1) {
        boss.phase = 2;
        addFloatingText(boss.x - cameraX, boss.y - 20, 'PHASE 2 !!!', '#e74c3c');
        spawnParticles(boss.x + boss.w/2, boss.y + boss.h/2, '#e74c3c', 20);
      }

      const spd2 = boss.phase === 2 ? 2.0 : 1.2;

      // Déplacement vers le joueur
      if (player.x > boss.x + boss.w) { boss.vx = spd2; boss.dir = 1; }
      else { boss.vx = -spd2; boss.dir = -1; }

      // Saut périodique
      boss.jumpTimer--;
      if (boss.jumpTimer <= 0 && boss.onGround) {
        boss.vy = -12;
        boss.jumpTimer = boss.phase === 2 ? 70 : 110;
      }

      applyPhysics(boss);

      // Collision joueur ↔ boss
      if (!player.dead && player.invincible <= 0 && collides(player, boss)) {
        const stomped = player.vy > 0 && player.y + player.h < boss.y + boss.h * 0.4 + 10;
        if (stomped) {
          boss.hp--;
          player.vy = -9;
          spawnParticles(boss.x + boss.w/2, boss.y, '#f5c518', 12);
          addFloatingText(boss.x - cameraX, boss.y - 10, 'TOUCHÉ !', C.gold);
          if (boss.hp <= 0) {
            boss.dead = true;
            boss.deadTimer = 60;
            spawnParticles(boss.x + boss.w/2, boss.y + boss.h/2, '#f5c518', 40);
            signatures = Math.min(500, signatures + 100);
            updateUI();
            setTimeout(() => { state = 'end'; showOverlay('win'); }, 2000);
          }
        } else {
          player.invincible = 100;
          lives--;
          updateUI();
          spawnParticles(player.x + player.w/2, player.y + player.h/2, '#e74c3c', 15);
		  if (level === 2) deathReason = 'boss';
          if (lives <= 0) {
  setTimeout(() => {
    if (deathReason === 'boss') {
      showOverlay('boss_loose');
    } else {
      showOverlay('loose');
    }
  }, 500);
  state = 'end';
}
        }
      }
    }
  }

  // ── Particules ──
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.2;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }

  // ── Textes flottants ──
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const t = floatingTexts[i];
    t.y += t.vy;
    t.life--;
    if (t.life <= 0) floatingTexts.splice(i, 1);
  }

  // Win si 30 signatures sans boss
  // Passage au niveau boss
if (signatures >= 30 && level === 1) {
  level = 2;
  buildBossLevel();
}
  /*if (signatures >= 30 && (!boss || boss.dead) && state === 'playing') {
    state = 'end';
    setTimeout(() => showOverlay('win'), 30);
  } */

  // Boss intro timer
  if (bossIntro) {
    bossIntroTimer--;
    if (bossIntroTimer <= 0) bossIntro = false;
  }
}

// ── RENDU ──
function drawBackground() {
  // Ciel dégradé
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#1a0a2e');
  grad.addColorStop(0.6, '#2d1b5e');
  grad.addColorStop(1, '#0d0620');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Étoiles
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  const stars = [[50,30],[120,70],[200,20],[300,50],[450,35],[600,80],[700,25],[750,60]];
  for (const [sx, sy] of stars) {
    ctx.fillRect((sx - cameraX * 0.05 + 800) % 800, sy, 2, 2);
  }

  // Immeubles fond
  ctx.fillStyle = '#2d1b5e';
  const buildings = [[0,200,60,200],[80,250,50,150],[180,220,70,180],[300,240,55,160],[400,200,80,200],[520,230,60,170],[640,210,70,190],[760,245,50,155]];
  for (const [bx, by, bw, bh] of buildings) {
    ctx.fillRect((bx - cameraX * 0.15 + 1000) % 900, by, bw, bh);
    // fenêtres
    ctx.fillStyle = 'rgba(245,197,24,0.3)';
    for (let wy = by + 15; wy < by + bh - 10; wy += 22) {
      for (let wx = bx + 8; wx < bx + bw - 8; wx += 16) {
        ctx.fillRect((wx - cameraX * 0.15 + 1000) % 900, wy, 7, 10);
      }
    }
    ctx.fillStyle = '#2d1b5e';
  }
}

function drawPlatforms() {
  for (const p of platforms) {
    const px = p.x - cameraX;
    if (px + p.w < 0 || px > W) continue;

    if (p.type === 'ground') {
      ctx.fillStyle = C.ground;
      ctx.fillRect(px, p.y, p.w, p.h);
      ctx.fillStyle = C.groundTop;
      ctx.fillRect(px, p.y, p.w, 6);
      // herbe
      ctx.fillStyle = '#2d5a1a';
      for (let gx = px; gx < px + p.w; gx += 8) {
        ctx.fillRect(gx, p.y - 3, 4, 4);
      }
    } else {
      ctx.fillStyle = C.platform;
      ctx.fillRect(px, p.y, p.w, p.h);
      ctx.fillStyle = C.platformTop;
      ctx.fillRect(px, p.y, p.w, 4);
      // brique
      ctx.fillStyle = '#5a3010';
      for (let bx = px; bx < px + p.w; bx += 18) {
        ctx.fillRect(bx, p.y + 4, 1, p.h - 4);
      }
    }
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = p.life / 60;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - cameraX - p.size/2, p.y - p.size/2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

function drawFloatingTexts() {
  for (const t of floatingTexts) {
    ctx.globalAlpha = t.life / 60;
    ctx.font = '9px "Press Start 2P"';
    ctx.fillStyle = t.color;
    ctx.textAlign = 'center';
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

function drawBossIntro() {
  if (!bossIntro) return;
  const alpha = Math.min(1, bossIntroTimer / 30) * Math.min(1, (bossIntroTimer - 10) / 20);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(20,5,10,0.7)';
  ctx.fillRect(0, H/2 - 40, W, 80);
  ctx.fillStyle = '#e74c3c';
  ctx.font = '18px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('⚠ BOSS : PHILIPPE POUTOU ⚠', W/2, H/2 - 8);
  ctx.fillStyle = '#f5c518';
  ctx.font = '8px "Press Start 2P"';
  ctx.fillText('Candidat NPA • Ouvrier Ford • Indomptable !', W/2, H/2 + 16);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

function render() {
  ctx.clearRect(0, 0, W, H);
  drawBackground();
  drawPlatforms();

  for (const e of enemies) drawEnemy(e);
  drawBoss();
  drawPlayer(player);
  drawParticles();
  drawFloatingTexts();
  drawBossIntro();
}

// ── UI ──
function updateUI() {
  document.getElementById('sigCount').textContent = `${signatures} / 30`;
  document.getElementById('signFill').style.width = `${(signatures/500)*100}%`;
  document.getElementById('levelDisplay').textContent = level;
  const hearts = ['❤️'.repeat(lives), '🖤'.repeat(Math.max(0, 3 - lives))].join('');
  document.getElementById('lifeDisplay').textContent = hearts || '💀';
}

function showOverlay(type) {
  const ov = document.getElementById('overlay');
  ov.innerHTML = '';
  ov.style.display = 'flex';

  if (type === 'win') {
    ov.innerHTML = `
      <h1 style="font-size:14px;color:#f5c518;text-align:center;line-height:2;text-shadow:0 0 20px #f5c518;margin-bottom:16px">
        🎉 VICTOIRE !<br>500 SIGNATURES<br>OBTENUES ! 🎉
      </h1>
      <p style="font-size:8px;color:#ccc;text-align:center;line-height:2.2;margin-bottom:24px">
        Vous êtes qualifié(e) pour la présidentielle !<br>
        Signatures : ${signatures}/500<br>
        Philippe Poutou a été battu !
      </p>
      <button id="startBtn" onclick="restart()">REJOUER</button>
    `;
  } else if (type === 'boss_loose') {
  ov.innerHTML = `
    <h1 style="font-size:14px;color:#e74c3c;text-align:center;line-height:2;text-shadow:0 0 20px #e74c3c;margin-bottom:16px">
      ⚠ DÉFAITE FACE À POUTOU ⚠
    </h1>
    <p style="font-size:8px;color:#ccc;text-align:center;line-height:2.2;margin-bottom:24px">
      Le boss vous a stoppé net...<br>
      Philippe Poutou vous a éliminé en duel !<br><br>
      Signatures : ${signatures}/30
    </p>
    <button id="startBtn" onclick="restart()" style="background:#e74c3c;box-shadow:0 4px 0 #8e1010">
      RÉESSAYER
    </button>
  `;
}

  else {
    ov.innerHTML = `
      <h1 style="font-size:14px;color:#e74c3c;text-align:center;line-height:2;text-shadow:0 0 20px #e74c3c;margin-bottom:16px">
        ❌ DÉFAITE !<br>PAS ASSEZ DE<br>SIGNATURES...
      </h1>
      <p style="font-size:8px;color:#ccc;text-align:center;line-height:2.2;margin-bottom:24px">
        Signatures obtenues : ${signatures}/500<br>
        Vous avez écrasé trop de citoyens<br>
      </p>
      <button id="startBtn" onclick="restart()" style="background:#e74c3c;box-shadow:0 4px 0 #8e1010">RÉESSAYER</button>
    `;
  }
}

function buildBossLevel() {
  enemies = [];
  platforms = [];

  // petit level boss simple (sans toucher au reste du moteur)
  platforms = [
    { x: 0, y: 400, w: 2000, h: 50, type: 'ground' },
    { x: 300, y: 320, w: 200, h: 14, type: 'plat' },
    { x: 600, y: 280, w: 200, h: 14, type: 'plat' },
  ];

  boss = {
    x: 1000,
    y: 320 - 52,
    w: 40,
    h: 52,
    hp: 8,
    maxHp: 8,
    vx: 1.2,
    vy: 0,
    onGround: false,
    frame: 0,
    frameTimer: 0,
    dead: false,
    deadTimer: 0,
    phase: 1,
    jumpTimer: 120,
    dir: -1,
    activated: true,
    introAnim: 0,
  };

  cameraX = 0;
  player.x = 100;
  player.y = 280;
}

function restart() {
  signatures = 0; lives = 3; level = 1;
  player.invincible = 0; player.dead = false;
  player.vx = 0; player.vy = 0;
  document.getElementById('overlay').style.display = 'none';
  buildLevel(1);
  updateUI();
  state = 'playing';
}

// ── BOUCLE ──
let last = 0;
function loop(ts) {
  const dt = ts - last; last = ts;
  update();
  render();
  requestAnimationFrame(loop);
}

// ── CONTRÔLES ──
document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
    e.preventDefault();
  }
});
document.addEventListener('keyup', e => { keys[e.code] = false; });

// ── DÉMARRAGE ──
window.addEventListener("load", () => {
document.getElementById('startBtn').onclick = () => {
  document.getElementById('overlay').style.display = 'none';
  buildLevel(1);
  updateUI();
  state = 'playing';
};

buildLevel(1);
updateUI();
requestAnimationFrame(loop);
});
