(function () {
  const nav = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const navLinks = document.getElementById('navLinks');

  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    burger.classList.remove('open');
    navLinks.classList.remove('open');
  }));

  // Aparición al hacer scroll
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Link activo según la sección visible
  const links = [...navLinks.querySelectorAll('a[href^="#"]:not(.btn)')];
  const sections = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const steps = document.getElementById('steps');
  const parallaxEls = [...document.querySelectorAll('[data-parallax]')];

  let ticking = false;
  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 30);

    let current = sections[0];
    sections.forEach(s => { if (s.getBoundingClientRect().top < window.innerHeight * 0.4) current = s; });
    links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current.id));

    parallaxEls.forEach(el => {
      const k = parseFloat(el.dataset.parallax);
      const r = el.parentElement.getBoundingClientRect();
      const offset = (r.top + r.height / 2 - window.innerHeight / 2) * k;
      el.style.translate = `0 ${offset.toFixed(1)}px`;
    });

    // La línea del proceso se llena a medida que avanzas
    const sr = steps.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (window.innerHeight * 0.85 - sr.top) / (sr.height + window.innerHeight * 0.4)));
    steps.style.setProperty('--progress', p.toFixed(3));
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  // Tarjetas que se inclinan en 3D y siguen el brillo del cursor
  const canHover = window.matchMedia('(hover: hover)').matches;
  document.querySelectorAll('.tilt').forEach(card => {
    if (!canHover) return;
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', px * 100 + '%');
      card.style.setProperty('--my', py * 100 + '%');
      card.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 10}deg) rotateY(${(px - 0.5) * 12}deg) translateY(-6px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });

  // Formulario: validación en el navegador (no hay backend todavía)
  const form = document.getElementById('contactForm');
  const msg = document.getElementById('formMsg');
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    form.querySelectorAll('[required]').forEach(f => {
      const bad = !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
      f.classList.toggle('invalid', bad);
      if (bad) ok = false;
    });
    if (!ok) { msg.style.color = '#ff8a8a'; msg.textContent = 'Revisa los campos marcados.'; return; }
    msg.style.color = '';
    msg.textContent = '¡Gracias! Recibimos tu solicitud y te contactaremos pronto.';
    form.reset();
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
