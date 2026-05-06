// ============ LOADER ============
(function loader() {
  const bar = document.getElementById('loaderBar');
  const count = document.getElementById('loaderCount');
  const loader = document.getElementById('loader');
  let p = 0;
  const tick = setInterval(() => {
    p += Math.random() * 8 + 3;
    if (p >= 100) {
      p = 100;
      bar.style.width = p + '%';
      count.textContent = Math.floor(p);
      clearInterval(tick);
      setTimeout(() => {
        loader.classList.add('done');
        document.body.style.overflow = 'auto';
      }, 350);
    } else {
      bar.style.width = p + '%';
      count.textContent = Math.floor(p);
    }
  }, 80);
  document.body.style.overflow = 'hidden';
})();

// ============ LIVE TIME ============
(function clock() {
  const el = document.getElementById('liveTime');
  function update() {
    const d = new Date();
    const opts = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false };
    el.textContent = d.toLocaleTimeString('en-GB', opts) + ' IST';
  }
  update(); setInterval(update, 1000);
})();

// ============ CUSTOM CURSOR ============
(function cursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  const contrastSections = document.querySelectorAll('#dual, #contact');
  let mx = window.innerWidth/2, my = window.innerHeight/2;
  let rx = mx, ry = my;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`; });
  function loop() {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  }
  loop();

  const hovers = document.querySelectorAll('a, .work-item, .dual-card, .award, .skill-cat, .word, button');
  hovers.forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });

  contrastSections.forEach((sectionEl) => {
    sectionEl.addEventListener('mouseenter', () => document.body.classList.add('cursor-contrast'));
    sectionEl.addEventListener('mouseleave', () => document.body.classList.remove('cursor-contrast'));
  });
})();

// ============ SCROLL REVEAL ============
(function reveal() {
  const items = document.querySelectorAll('.reveal, .reveal-stagger');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  items.forEach(el => io.observe(el));
})();

// ============ SMOOTH ANCHOR ============
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length > 1) {
      const t = document.querySelector(id);
      if (t) {
        e.preventDefault();
        t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });
});

// ============ COMMENT FORM ============
(function commentForm() {
  const form = document.getElementById('portfolioCommentForm');
  const status = document.getElementById('commentStatus');
  if (!form || !status) return;

  form.addEventListener('submit', () => {
    status.textContent = 'Thanks! Submitting your comment...';
    setTimeout(() => {
      form.reset();
      status.textContent = 'Comment submitted. Thank you for your feedback.';
    }, 700);
  });
})();

// ============ SHIP CONTROL (CLICK TO TAKE OVER) ============
(function shipControl() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const heroSection = document.querySelector('.hero');
  const stage = document.querySelector('.orb-stage');
  const playerGroup = document.querySelector('.player-group');
  const playerShip = document.querySelector('.player');
  const enemyShips = Array.from(document.querySelectorAll('.enemy'));
  const lifeHud = document.getElementById('lifeHud');
  const lifeHearts = Array.from(document.querySelectorAll('.life-heart'));
  const enemyBullets = Array.from(document.querySelectorAll('.ebullet'));

  if (!heroSection || !stage || !playerGroup || !playerShip || enemyBullets.length === 0) return;

  const maxHits = 5;
  const bulletHitLock = new WeakMap();
  const asteroidHitLock = new WeakMap();
  let isUserControlEnabled = false;
  let currentOffsetX = 0;
  let targetOffsetX = 0;
  let hitCount = 0;
  let controlStartTime = 0;
  let lastSpawnTime = 0;
  let activeDynamicBullets = 0;
  let currentStaticBulletDuration = 3;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const hasOverlap = (a, b) =>
    a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

  const getCurrentTranslateX = () => {
    const matrix = window.getComputedStyle(playerGroup).transform;
    if (!matrix || matrix === 'none') return 0;
    return new DOMMatrixReadOnly(matrix).m41;
  };

  const resetBulletLocks = () => {
    enemyBullets.forEach((bulletEl) => bulletHitLock.set(bulletEl, false));
  };

  const resetAsteroidLocks = () => {
    enemyShips.forEach((enemyEl) => asteroidHitLock.set(enemyEl, false));
  };

  const isHeroStillActive = () => {
    const rect = heroSection.getBoundingClientRect();
    return rect.bottom > 140;
  };

  const applyStaticBulletSpeed = (durationSeconds) => {
    if (Math.abs(durationSeconds - currentStaticBulletDuration) < 0.01) return;
    currentStaticBulletDuration = durationSeconds;
    enemyBullets.forEach((bulletEl) => {
      bulletEl.style.animationDuration = `${durationSeconds}s`;
    });
  };

  const clearDynamicBullets = () => {
    const dynamicBullets = stage.querySelectorAll('.ebullet-dynamic');
    dynamicBullets.forEach((bulletEl) => bulletEl.remove());
    activeDynamicBullets = 0;
  };

  const createDynamicBullet = (durationSeconds) => {
    if (!isUserControlEnabled) return;
    const bulletEl = document.createElement('span');
    bulletEl.className = 'ebullet ebullet-dynamic';
    bulletEl.style.left = `${(10 + Math.random() * 80).toFixed(2)}%`;
    bulletEl.style.animationDuration = `${durationSeconds}s`;
    stage.appendChild(bulletEl);
    bulletHitLock.set(bulletEl, false);
    activeDynamicBullets += 1;
    bulletEl.addEventListener('animationend', () => {
      bulletEl.remove();
      activeDynamicBullets = Math.max(0, activeDynamicBullets - 1);
    }, { once: true });
  };

  const updateBulletDifficulty = () => {
    if (!isUserControlEnabled) return;

    const now = performance.now();
    const elapsedSeconds = (now - controlStartTime) / 1000;
    const level = Math.floor(elapsedSeconds / 4);
    const staticDuration = Math.max(0.78, 3 - level * 0.32);
    const dynamicDuration = Math.max(0.58, 2.2 - level * 0.24);
    const spawnGap = Math.max(110, 760 - level * 110);
    const maxDynamicBulletCount = Math.min(20, 3 + level * 2);

    applyStaticBulletSpeed(staticDuration);

    if (now - lastSpawnTime >= spawnGap && activeDynamicBullets < maxDynamicBulletCount) {
      createDynamicBullet(dynamicDuration);
      lastSpawnTime = now;
    }
  };

  const setShipTargetFromCursor = (event) => {
    if (!isUserControlEnabled) return;
    const stageRect = stage.getBoundingClientRect();
    const halfStage = stageRect.width / 2;
    const shipHalfWidth = playerShip.getBoundingClientRect().width / 2;
    const maxOffset = Math.max(0, halfStage - shipHalfWidth - 8);
    const pointerOffset = event.clientX - (stageRect.left + halfStage);
    targetOffsetX = clamp(pointerOffset, -maxOffset, maxOffset);
  };

  const releaseControl = () => {
    if (!isUserControlEnabled) return;
    isUserControlEnabled = false;
    playerGroup.classList.remove('manual-control');
    playerGroup.style.transform = '';
    applyStaticBulletSpeed(3);
    clearDynamicBullets();
    if (lifeHud) {
      lifeHud.classList.remove('visible');
      lifeHearts.forEach((heartEl) => heartEl.classList.remove('lost'));
    }
  };

  const updateLivesHud = () => {
    if (lifeHearts.length === 0) return;
    const livesLeft = Math.max(0, maxHits - hitCount);
    lifeHearts.forEach((heartEl, index) => {
      heartEl.classList.toggle('lost', index >= livesLeft);
    });
  };

  const startControl = () => {
    if (isUserControlEnabled) return;
    if (!isHeroStillActive()) return;
    isUserControlEnabled = true;
    hitCount = 0;
    resetBulletLocks();
    resetAsteroidLocks();
    clearDynamicBullets();
    applyStaticBulletSpeed(3);
    controlStartTime = performance.now();
    lastSpawnTime = controlStartTime;
    updateLivesHud();
    if (lifeHud) lifeHud.classList.add('visible');
    currentOffsetX = getCurrentTranslateX();
    targetOffsetX = currentOffsetX;
    playerGroup.classList.add('manual-control');
    playerGroup.style.transform = `translateX(${currentOffsetX}px)`;
  };

  const registerHit = (damage = 1) => {
    if (!isUserControlEnabled) return;
    playerShip.classList.remove('is-hit');
    // Force reflow so the hit flash can replay every time.
    void playerShip.offsetWidth;
    playerShip.classList.add('is-hit');
    hitCount += damage;
    updateLivesHud();
    if (hitCount >= maxHits) {
      releaseControl();
    }
  };

  const detectBulletHits = () => {
    if (!isUserControlEnabled) return;

    const shipRect = playerShip.getBoundingClientRect();
    const allEnemyBullets = stage.querySelectorAll('.ebullet');
    allEnemyBullets.forEach((bulletEl) => {
      const bulletOpacity = Number.parseFloat(window.getComputedStyle(bulletEl).opacity);
      if (bulletOpacity < 0.2) {
        bulletHitLock.set(bulletEl, false);
        return;
      }

      const isLocked = bulletHitLock.get(bulletEl) === true;
      if (isLocked) return;

      const bulletRect = bulletEl.getBoundingClientRect();
      if (hasOverlap(shipRect, bulletRect)) {
        bulletHitLock.set(bulletEl, true);
        registerHit(1);
      }
    });
  };

  const detectAsteroidHits = () => {
    if (!isUserControlEnabled || enemyShips.length === 0) return;

    const shipRect = playerShip.getBoundingClientRect();
    enemyShips.forEach((enemyEl) => {
      const enemyOpacity = Number.parseFloat(window.getComputedStyle(enemyEl).opacity);
      if (enemyOpacity < 0.2) {
        asteroidHitLock.set(enemyEl, false);
        return;
      }

      const isLocked = asteroidHitLock.get(enemyEl) === true;
      if (isLocked) return;

      const enemyRect = enemyEl.getBoundingClientRect();
      if (hasOverlap(shipRect, enemyRect)) {
        asteroidHitLock.set(enemyEl, true);
        registerHit(2);
      }
    });
  };

  const animateManualControl = () => {
    if (isUserControlEnabled && !isHeroStillActive()) {
      releaseControl();
    }

    if (isUserControlEnabled) {
      currentOffsetX += (targetOffsetX - currentOffsetX) * 0.18;
      playerGroup.style.transform = `translateX(${currentOffsetX}px)`;
      updateBulletDifficulty();
      detectBulletHits();
      detectAsteroidHits();
    }
    window.requestAnimationFrame(animateManualControl);
  };

  playerShip.addEventListener('click', startControl);
  window.addEventListener('mousemove', setShipTargetFromCursor);
  window.requestAnimationFrame(animateManualControl);
})();

// ============ HERO SCENE FADE ON SCROLL ============
(function heroFade() {
  const hero = document.querySelector('.hero');
  const scene = document.querySelector('.orbital');
  if (!hero || !scene) return;

  // Wait for the entry fade-in to finish before we start controlling opacity
  let active = false;
  setTimeout(() => {
    scene.style.animation = 'none';
    scene.style.opacity = '1';
    active = true;
    update();
  }, 2400);

  let ticking = false;
  function update() {
    if (!active) return;
    const rect = hero.getBoundingClientRect();
    const heroH = hero.offsetHeight;
    const scrolled = Math.max(0, -rect.top);
    const start = heroH * 0.3;
    const end = heroH * 0.8;
    let opacity = 1;
    if (scrolled > start) {
      opacity = 1 - Math.min(1, (scrolled - start) / (end - start));
    }
    scene.style.opacity = opacity;
    // Pause when fully gone to save CPU
    if (opacity <= 0.02) {
      scene.style.visibility = 'hidden';
    } else {
      scene.style.visibility = 'visible';
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
})();
