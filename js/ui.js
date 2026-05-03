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

function restart() {
  signatures = 0; lives = 3; level = 1;
  player.invincible = 0; player.dead = false;
  player.vx = 0; player.vy = 0;
  document.getElementById('overlay').style.display = 'none';
  buildLevel(1);
  updateUI();
  state = 'playing';
}