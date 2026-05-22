/* =====================================================
   FULL-PAGE DYNAMIC GRAPH BACKGROUND ANIMATION
   Canvas is fixed; nodes drift across the full viewport.
   Colorful pastel palette — pink, peach, lavender, mint,
   sky blue, lemon, coral, violet, seafoam.
   ===================================================== */
(function () {
  const canvas = document.getElementById('graphCanvas');
  const ctx = canvas.getContext('2d');

  // Rich colorful pastel palette
  const PALETTE = [
    { r: 255, g: 160, b: 180 }, // rose pink
    { r: 255, g: 179, b: 140 }, // peach coral
    { r: 255, g: 210, b: 120 }, // warm lemon
    { r: 200, g: 240, b: 160 }, // lime mint
    { r: 130, g: 220, b: 200 }, // seafoam teal
    { r: 120, g: 200, b: 255 }, // sky blue
    { r: 190, g: 165, b: 255 }, // soft lavender
    { r: 255, g: 150, b: 200 }, // hot pastel pink
    { r: 255, g: 200, b: 160 }, // apricot
    { r: 160, g: 235, b: 215 }, // mint green
    { r: 210, g: 180, b: 255 }, // violet
    { r: 255, g: 230, b: 130 }, // pastel yellow
    { r: 150, g: 215, b: 255 }, // baby blue
    { r: 255, g: 170, b: 160 }, // salmon
  ];

  const MAX_NODES = 70;
  const EDGE_DIST = 200;
  const NODE_LIFE_MIN = 6000;
  const NODE_LIFE_MAX = 16000;
  const SPAWN_INTERVAL = 600;
  const SPEED = 0.5;

  let nodes = [];
  let lastSpawn = 0;
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function randColor() {
    return PALETTE[Math.floor(Math.random() * PALETTE.length)];
  }

  function spawnNode(x, y) {
    const c = randColor();
    const life = NODE_LIFE_MIN + Math.random() * (NODE_LIFE_MAX - NODE_LIFE_MIN);
    return {
      x: x !== undefined ? x : Math.random() * W,
      y: y !== undefined ? y : Math.random() * H,
      vx: (Math.random() - 0.5) * SPEED,
      vy: (Math.random() - 0.5) * SPEED,
      r: 3 + Math.random() * 4,
      c,
      born: performance.now(),
      life,
      alpha: 0,
      pulse: Math.random() * Math.PI * 2,
    };
  }

  // Seed initial nodes spread across the viewport
  for (let i = 0; i < MAX_NODES * 0.75; i++) {
    const n = spawnNode();
    n.born -= Math.random() * 5000;
    n.alpha = 0.4 + Math.random() * 0.6;
    nodes.push(n);
  }

  function draw(ts) {
    requestAnimationFrame(draw);
    ctx.clearRect(0, 0, W, H);

    // Spawn new nodes
    if (ts - lastSpawn > SPAWN_INTERVAL && nodes.length < MAX_NODES) {
      nodes.push(spawnNode());
      lastSpawn = ts;
    }

    const FADE_IN  = 1000;
    const FADE_OUT = 2000;

    // Cull dead nodes
    nodes = nodes.filter(n => (ts - n.born) < n.life + FADE_OUT);

    // Compute alphas
    nodes.forEach(n => {
      const age = ts - n.born;
      if (age < FADE_IN) {
        n.alpha = age / FADE_IN;
      } else if (age > n.life) {
        n.alpha = 1 - (age - n.life) / FADE_OUT;
      } else {
        n.alpha = 1;
      }
      n.alpha = Math.max(0, Math.min(1, n.alpha));
      n.pulse += 0.016;
    });

    // Draw edges first (behind nodes)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < EDGE_DIST) {
          const proximity = 1 - dist / EDGE_DIST;
          const edgeAlpha = proximity * 0.6 * Math.min(a.alpha, b.alpha);
          const cr = Math.round((a.c.r + b.c.r) / 2);
          const cg = Math.round((a.c.g + b.c.g) / 2);
          const cb = Math.round((a.c.b + b.c.b) / 2);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(${cr},${cg},${cb},${edgeAlpha})`;
          ctx.lineWidth = 0.6 + proximity * 1.2;
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    nodes.forEach(n => {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0)  { n.x = 0;  n.vx *= -1; }
      if (n.x > W)  { n.x = W;  n.vx *= -1; }
      if (n.y < 0)  { n.y = 0;  n.vy *= -1; }
      if (n.y > H)  { n.y = H;  n.vy *= -1; }

      const pulsedR = n.r + Math.sin(n.pulse) * 1;
      const { r, g, b } = n.c;

      // Soft glow halo
      const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, pulsedR * 4);
      grd.addColorStop(0, `rgba(${r},${g},${b},${n.alpha * 0.45})`);
      grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.beginPath();
      ctx.arc(n.x, n.y, pulsedR * 4, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Solid core dot
      ctx.beginPath();
      ctx.arc(n.x, n.y, pulsedR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${n.alpha})`;
      ctx.fill();
    });
  }

  requestAnimationFrame(draw);
})();


/* =====================================================
   NAVBAR: scroll class + active link highlight
   ===================================================== */
(function () {
  const navbar = document.getElementById('navbar');
  const links  = document.querySelectorAll('.nav-links a');
  const toggle = document.getElementById('navToggle');
  const navList = document.querySelector('.nav-links');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  });

  toggle && toggle.addEventListener('click', () => {
    navList.classList.toggle('open');
  });

  // Active section highlight
  const sections = document.querySelectorAll('section[id]');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const active = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: 0.35 });
  sections.forEach(s => obs.observe(s));
})();


/* =====================================================
   PUBLICATION FILTER
   ===================================================== */
(function () {
  const btns  = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.pub-card');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      cards.forEach(c => {
        if (f === 'all') {
          c.classList.remove('hidden');
        } else if (f === 'preprint') {
          c.classList.toggle('hidden', c.dataset.type !== 'preprint');
        } else if (f === 'patent') {
          c.classList.toggle('hidden', c.dataset.type !== 'patent');
        } else if (f === 'older') {
          const yr = parseInt(c.dataset.year);
          c.classList.toggle('hidden', yr >= 2024);
        } else {
          c.classList.toggle('hidden', c.dataset.year !== f);
        }
      });
    });
  });
})();


/* =====================================================
   SCROLL FADE-IN ANIMATIONS
   ===================================================== */
(function () {
  const targets = document.querySelectorAll(
    '.pub-card, .news-item, .timeline-item, .info-card, .teaching-card, .service-badge, .section-title'
  );

  targets.forEach((el, i) => {
    el.classList.add('fade-in');
    el.style.transitionDelay = (i % 8) * 0.05 + 's';
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

  targets.forEach(el => observer.observe(el));
})();
