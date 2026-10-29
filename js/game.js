/**
 * Flappy Bird Custom Game Engine
 * Featuring 9 Custom Characters, Classic Retro Flappy Aesthetics,
 * Web Audio Synth Sound Effects, Particle FX, and Leaderboard Integration.
 */

class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playFlap() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.12);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {}
  }

  playScore() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(987, now);
      osc1.frequency.setValueAtTime(1318, now + 0.08);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.linearRampToValueAtTime(0.01, now + 0.28);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.29);
    } catch (e) {}
  }

  playHit() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.18);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.19);
    } catch (e) {}
  }

  playDie() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.35);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
    } catch (e) {}
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
}

class FlappyGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sound = new SoundFX();

    // Virtual resolution (standard flappy proportions)
    this.width = 400;
    this.height = 600;

    // Character assets cache
    this.charImages = {};
    this.selectedCharId = 1;
    this.selectedCharName = "Character 1";
    this.playerName = localStorage.getItem('flappy_player_name') || "Player 1";

    // Game state: 'MENU', 'PLAYING', 'GAMEOVER'
    this.state = 'MENU';
    this.score = 0;
    this.bestScore = parseInt(localStorage.getItem('flappy_best_score') || '0', 10);

    // Physics parameters
    this.gravity = 0.28;
    this.jumpStrength = -5.8;
    this.pipeSpeed = 2.4;
    this.pipeSpawnInterval = 100; // frames
    this.pipeGap = 138;
    this.pipeWidth = 60;
    this.groundHeight = 90;

    // Bird state
    this.bird = {
      x: 90,
      y: 250,
      radius: 20,
      velocity: 0,
      rotation: 0,
      wingTimer: 0
    };

    // Game objects
    this.pipes = [];
    this.particles = [];
    this.groundOffset = 0;
    this.cloudOffset = 0;
    this.cityOffset = 0;
    this.frameCount = 0;

    // Event listeners & resize
    this.setupDisplay();
    this.preloadCharacters();
    this.bindEvents();

    // Animation Loop
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  setupDisplay() {
    const dpr = window.devicePixelRatio || 1;
    const parent = this.canvas.parentElement || document.body;
    const rect = parent.getBoundingClientRect();

    this.width = 400;
    if (rect.width > 0 && rect.height > 0) {
      this.height = Math.round(400 * (rect.height / rect.width));
    } else {
      this.height = 600;
    }

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    if (this.ctx.resetTransform) {
      this.ctx.resetTransform();
    } else {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    this.ctx.scale(dpr, dpr);
    this.ctx.imageSmoothingEnabled = true;
  }

  preloadCharacters() {
    this.charManager = new (window.CharacterManager || class {
      getCharacters() {
        return Array.from({ length: 9 }, (_, i) => ({
          id: i + 1,
          name: `Character ${i + 1}`,
          image: `assets/characters/char${i + 1}.png`
        }));
      }
    })();

    this.reloadCharacters();
  }

  reloadCharacters() {
    const list = this.charManager.getCharacters();
    this.charImages = {};
    list.forEach(c => {
      const img = new Image();
      img.src = c.image;
      this.charImages[c.id] = img;
    });
    if (list.length > 0 && !list.find(c => c.id === this.selectedCharId)) {
      this.selectedCharId = list[0].id;
      this.selectedCharName = list[0].name;
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => this.setupDisplay());

    // Jump handlers
    const doJump = () => {
      this.sound.init();
      if (this.state === 'PLAYING') {
        this.jump();
      }
    };

    this.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      doJump();
    });

    window.addEventListener('keydown', (e) => {
      // Huwag i-block ang spacebar kapag nagta-type sa input o textarea
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        doJump();
      }
    });
  }

  selectCharacter(id, name) {
    this.selectedCharId = id;
    this.selectedCharName = name || `Character ${id}`;
  }

  setPlayerName(name) {
    this.playerName = name.trim() || "Player 1";
    localStorage.setItem('flappy_player_name', this.playerName);
  }

  start() {
    this.sound.init();
    this.state = 'PLAYING';
    this.score = 0;
    this.bird.x = 90;
    this.bird.y = 250;
    this.bird.velocity = 0;
    this.bird.rotation = 0;
    this.pipes = [];
    this.particles = [];
    this.frameCount = 0;

    // Update in-game score label
    const scoreEl = document.getElementById('ingameScore');
    if (scoreEl) {
      scoreEl.innerText = '0';
      scoreEl.style.display = 'block';
    }

    // Hide overlays
    document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));

    this.jump();
  }

  jump() {
    this.bird.velocity = this.jumpStrength;
    this.sound.playFlap();

    // Create jump particles
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x: this.bird.x - 12 + Math.random() * 6,
        y: this.bird.y + 10 + Math.random() * 6,
        vx: (Math.random() - 0.7) * 2,
        vy: Math.random() * 2 + 1,
        radius: Math.random() * 3 + 2,
        color: 'rgba(255, 255, 255, 0.8)',
        life: 20
      });
    }
  }

  spawnPipe() {
    const minHeight = 60;
    const maxHeight = this.height - this.groundHeight - this.pipeGap - minHeight;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;

    this.pipes.push({
      x: this.width,
      topHeight: topHeight,
      bottomY: topHeight + this.pipeGap,
      passed: false
    });
  }

  triggerGameOver() {
    if (this.state === 'GAMEOVER') return;
    this.state = 'GAMEOVER';
    this.sound.playHit();
    setTimeout(() => this.sound.playDie(), 120);

    // Save best score
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem('flappy_best_score', this.bestScore.toString());
    }

    // Update Game Over UI
    const scoreEl = document.getElementById('ingameScore');
    if (scoreEl) scoreEl.style.display = 'none';

    document.getElementById('finalScore').innerText = this.score;
    document.getElementById('finalBestScore').innerText = this.bestScore;

    // Determine Medal
    const medalIcon = document.getElementById('medalIcon');
    const medalText = document.getElementById('medalText');
    if (this.score >= 30) {
      medalIcon.innerText = "💎";
      medalText.innerText = "Platinum Legend!";
    } else if (this.score >= 20) {
      medalIcon.innerText = "🥇";
      medalText.innerText = "Gold Master!";
    } else if (this.score >= 10) {
      medalIcon.innerText = "🥈";
      medalText.innerText = "Silver Flapper!";
    } else if (this.score >= 5) {
      medalIcon.innerText = "🥉";
      medalText.innerText = "Bronze Trainee!";
    } else {
      medalIcon.innerText = "🥚";
      medalText.innerText = "Keep practicing!";
    }

    document.getElementById('gameOverOverlay').classList.remove('hidden');
  }

  update() {
    this.frameCount++;

    // Parallax scrolling
    this.groundOffset = (this.groundOffset + this.pipeSpeed) % 24;
    this.cloudOffset = (this.cloudOffset + 0.4) % this.width;
    this.cityOffset = (this.cityOffset + 0.8) % this.width;

    if (this.state === 'PLAYING') {
      // Bird Physics
      this.bird.velocity += this.gravity;
      this.bird.y += this.bird.velocity;
      this.bird.wingTimer += 0.2;

      // Rotation calculation
      if (this.bird.velocity < 0) {
        this.bird.rotation = -0.38; // Tilt up
      } else {
        this.bird.rotation = Math.min(Math.PI / 2.2, this.bird.rotation + 0.05); // Dive
      }

      // Ceiling Collision
      if (this.bird.y - this.bird.radius < 0) {
        this.bird.y = this.bird.radius;
        this.bird.velocity = 0;
      }

      // Ground Collision
      const groundY = this.height - this.groundHeight;
      if (this.bird.y + this.bird.radius >= groundY) {
        this.bird.y = groundY - this.bird.radius;
        this.triggerGameOver();
        return;
      }

      // Spawn Pipes
      if (this.frameCount % this.pipeSpawnInterval === 0) {
        this.spawnPipe();
      }

      // Update Pipes
      for (let i = this.pipes.length - 1; i >= 0; i--) {
        const pipe = this.pipes[i];
        pipe.x -= this.pipeSpeed;

        // Check Score
        if (!pipe.passed && pipe.x + this.pipeWidth < this.bird.x) {
          pipe.passed = true;
          this.score++;
          this.sound.playScore();
          const scoreEl = document.getElementById('ingameScore');
          if (scoreEl) scoreEl.innerText = this.score;

          // Sparkle FX
          for (let s = 0; s < 6; s++) {
            this.particles.push({
              x: this.bird.x,
              y: this.bird.y,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              radius: Math.random() * 3 + 2,
              color: '#f1c40f',
              life: 25
            });
          }
        }

        // Pipe Collision (Circle vs Rect)
        const bx = this.bird.x;
        const by = this.bird.y;
        const br = this.bird.radius - 2; // slightly forgiving hitbox

        // Top Pipe
        if (
          bx + br > pipe.x &&
          bx - br < pipe.x + this.pipeWidth &&
          by - br < pipe.topHeight
        ) {
          this.triggerGameOver();
          return;
        }

        // Bottom Pipe
        if (
          bx + br > pipe.x &&
          bx - br < pipe.x + this.pipeWidth &&
          by + br > pipe.bottomY
        ) {
          this.triggerGameOver();
          return;
        }

        // Remove offscreen pipes
        if (pipe.x + this.pipeWidth < -10) {
          this.pipes.splice(i, 1);
        }
      }
    } else if (this.state === 'GAMEOVER') {
      // Fall to ground if in air
      const groundY = this.height - this.groundHeight;
      if (this.bird.y + this.bird.radius < groundY) {
        this.bird.velocity += this.gravity * 1.5;
        this.bird.y += this.bird.velocity;
        this.bird.rotation = Math.min(Math.PI / 2, this.bird.rotation + 0.08);
      }
    } else if (this.state === 'MENU') {
      // Idle bobbing
      this.bird.y = 250 + Math.sin(this.frameCount * 0.06) * 12;
      this.bird.rotation = 0;
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Classic Sky Gradient
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.height - this.groundHeight);
    skyGrad.addColorStop(0, '#4ec0ca');
    skyGrad.addColorStop(1, '#70c5ce');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, this.width, this.height - this.groundHeight);

    // 2. Distant City Skyline & Clouds
    this.drawBackgroundScenery();

    // 3. Classic Green Pipes
    this.drawPipes();

    // 4. Parallax Ground
    this.drawGround();

    // 5. Particles
    this.drawParticles();

    // 6. Flying Character (The Bird)
    this.drawCharacter();
  }

  drawBackgroundScenery() {
    const groundY = this.height - this.groundHeight;

    // Distant Clouds
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    for (let c = -1; c < 3; c++) {
      const cx = c * 220 - this.cloudOffset;
      this.drawCloud(cx, 120);
      this.drawCloud(cx + 110, 180, 0.7);
    }

    // Cityscape Silhouettes
    this.ctx.fillStyle = '#8ce0a8';
    for (let b = -1; b < 5; b++) {
      const bx = b * 95 - (this.cityOffset % 95);
      // Small retro building
      const h = 45 + (Math.abs(b * 37) % 35);
      this.ctx.fillRect(bx, groundY - h, 50, h);
      this.ctx.fillStyle = '#78cf95';
      this.ctx.fillRect(bx + 4, groundY - h + 6, 8, 8);
      this.ctx.fillRect(bx + 18, groundY - h + 6, 8, 8);
      this.ctx.fillRect(bx + 32, groundY - h + 6, 8, 8);
      this.ctx.fillStyle = '#8ce0a8';

      // Retro green tree
      this.ctx.beginPath();
      this.ctx.arc(bx + 75, groundY - 22, 18, 0, Math.PI * 2);
      this.ctx.fillStyle = '#65bc82';
      this.ctx.fill();
      this.ctx.fillStyle = '#8ce0a8';
    }
  }

  drawCloud(x, y, scale = 1) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.scale(scale, scale);
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 22, 0, Math.PI * 2);
    this.ctx.arc(20, -10, 26, 0, Math.PI * 2);
    this.ctx.arc(45, -5, 20, 0, Math.PI * 2);
    this.ctx.arc(60, 4, 16, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  drawPipes() {
    for (const pipe of this.pipes) {
      // Top Pipe
      this.drawPipeSection(pipe.x, 0, this.pipeWidth, pipe.topHeight, true);
      // Bottom Pipe
      const bottomHeight = this.height - this.groundHeight - pipe.bottomY;
      this.drawPipeSection(pipe.x, pipe.bottomY, this.pipeWidth, bottomHeight, false);
    }
  }

  drawPipeSection(x, y, w, h, isTop) {
    const rimH = 26;
    const rimOverhang = 3;

    this.ctx.save();

    // Pipe Body Gradient
    const bodyGrad = this.ctx.createLinearGradient(x, 0, x + w, 0);
    bodyGrad.addColorStop(0, '#558022');
    bodyGrad.addColorStop(0.18, '#73bf2e');
    bodyGrad.addColorStop(0.35, '#9ee54b');
    bodyGrad.addColorStop(0.65, '#73bf2e');
    bodyGrad.addColorStop(1, '#446618');

    // Body Outline
    this.ctx.fillStyle = '#2c3e14';
    this.ctx.fillRect(x, y, w, h);

    // Body Fill
    this.ctx.fillStyle = bodyGrad;
    this.ctx.fillRect(x + 2, y, w - 4, h);

    // Pipe Rim (Lip)
    const rimY = isTop ? y + h - rimH : y;
    const rimX = x - rimOverhang;
    const rimW = w + (rimOverhang * 2);

    // Rim Outline
    this.ctx.fillStyle = '#2c3e14';
    this.ctx.fillRect(rimX, rimY, rimW, rimH);

    // Rim Fill
    const rimGrad = this.ctx.createLinearGradient(rimX, 0, rimX + rimW, 0);
    rimGrad.addColorStop(0, '#558022');
    rimGrad.addColorStop(0.18, '#73bf2e');
    rimGrad.addColorStop(0.35, '#b4f05e');
    rimGrad.addColorStop(0.65, '#73bf2e');
    rimGrad.addColorStop(1, '#446618');

    this.ctx.fillStyle = rimGrad;
    this.ctx.fillRect(rimX + 2, rimY + 2, rimW - 4, rimH - 4);

    this.ctx.restore();
  }

  drawGround() {
    const groundY = this.height - this.groundHeight;

    // Grass Green Top Strip
    this.ctx.fillStyle = '#73bf2e';
    this.ctx.fillRect(0, groundY, this.width, 14);

    // Green dark border line
    this.ctx.fillStyle = '#558022';
    this.ctx.fillRect(0, groundY + 12, this.width, 3);

    // Dirt base
    this.ctx.fillStyle = '#ded895';
    this.ctx.fillRect(0, groundY + 15, this.width, this.groundHeight - 15);

    // Moving diagonal stripes for ground motion
    this.ctx.fillStyle = '#d0c878';
    for (let x = -30; x < this.width + 30; x += 24) {
      const sx = x - this.groundOffset;
      this.ctx.beginPath();
      this.ctx.moveTo(sx, groundY + 15);
      this.ctx.lineTo(sx + 12, groundY + 15);
      this.ctx.lineTo(sx - 2, groundY + this.groundHeight);
      this.ctx.lineTo(sx - 14, groundY + this.groundHeight);
      this.ctx.fill();
    }
  }

  drawCharacter() {
    const { x, y, radius, rotation, wingTimer } = this.bird;
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(rotation);

    // Cute animated flapping wings behind character
    const wingFlap = Math.sin(wingTimer * 12) * 8;
    this.ctx.fillStyle = '#f39c12';
    this.ctx.beginPath();
    this.ctx.ellipse(-radius + 2, wingFlap, 11, 7, -0.2, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = '#d35400';
    this.ctx.stroke();

    // Outer glow / border ring
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius + 2, 0, Math.PI * 2);
    this.ctx.fillStyle = '#f1c40f';
    this.ctx.fill();
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = '#000';
    this.ctx.stroke();

    // Draw Character Face (clipped into circle)
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.clip();

    const img = this.charImages[this.selectedCharId];
    if (img && img.complete) {
      this.ctx.drawImage(img, -radius, -radius, radius * 2, radius * 2);
    } else {
      // Fallback yellow face
      this.ctx.fillStyle = '#ffcc00';
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  drawParticles() {
    for (const p of this.particles) {
      this.ctx.save();
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  loop(currentTime) {
    this.update();
    this.draw();
    requestAnimationFrame((t) => this.loop(t));
  }
}

window.FlappyGame = FlappyGame;
