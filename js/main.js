/* ============================================
   Pippin Play — Main JS
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Scroll-based nav style ──────────────────
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ── Mobile hamburger ────────────────────────
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
      const isOpen = mobileMenu.classList.contains('open');
      hamburger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // ── Scroll fade-in / slide-in animations ────
  const animEls = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right');
  if (animEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -32px 0px' });
    animEls.forEach(el => observer.observe(el));
  }

  // ── FAQ accordion ───────────────────────────
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      // Close all
      document.querySelectorAll('.faq-item.open').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
      });
      // Toggle clicked
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // ── Smooth scroll for anchor links ──────────
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const selector = link.getAttribute('href');
      if (!selector || selector === '#') return;

      let target;
      try {
        target = document.querySelector(selector);
      } catch {
        return;
      }

      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ── Animated stat counters ──────────────────
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || '';
        const duration = 1200;
        const step = target / (duration / 16);
        let current = 0;
        const tick = () => {
          current = Math.min(current + step, target);
          el.textContent = Math.floor(current) + suffix;
          if (current < target) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        countObserver.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(el => countObserver.observe(el));
  }


  // ── Stacked cards (scroll-peel) ──────────────
  const stackContainer = document.querySelector('.stack-container');
  if (stackContainer) {
    const cards = stackContainer.querySelectorAll('.stack-card');
    const progressBar = stackContainer.querySelector('.stack-progress-bar');
    const hint = stackContainer.querySelector('.stack-hint');
    const total = cards.length;

    function updateStack() {
      const rect = stackContainer.getBoundingClientRect();
      const containerH = stackContainer.offsetHeight;
      const viewH = window.innerHeight;

      // How far we've scrolled into the container (0 to 1)
      const scrolled = Math.max(0, -rect.top);
      const scrollRange = containerH - viewH;
      const progress = Math.min(1, Math.max(0, scrolled / scrollRange));

      // Update progress bar
      if (progressBar) progressBar.style.width = (progress * 100) + '%';

      // Hide hint after first scroll
      if (hint) hint.style.opacity = progress > 0.05 ? '0' : '';

      // Each card gets an equal slice of the scroll range
      const sliceSize = 1 / total;

      // First pass: determine each card's state
      const states = [];
      cards.forEach((card, i) => {
        const cardStart = i * sliceSize;
        const cardProgress = Math.min(1, Math.max(0, (progress - cardStart) / sliceSize));
        if (i < total - 1 && cardProgress >= 0.95) {
          states.push('peeled');
        } else if (cardProgress > 0 && cardProgress < 0.95) {
          states.push('peeling');
        } else {
          states.push('waiting');
        }
      });

      // Find the top visible card (first non-peeled)
      const topVisible = states.indexOf('peeling') !== -1
        ? states.indexOf('peeling')
        : states.indexOf('waiting');

      // Second pass: apply transforms
      cards.forEach((card, i) => {
        const cardStart = i * sliceSize;
        const cardProgress = Math.min(1, Math.max(0, (progress - cardStart) / sliceSize));
        const isTop = (i === topVisible);

        if (states[i] === 'peeled') {
          card.style.transform = 'translateY(-120px) scale(0.8) rotateX(8deg)';
          card.style.opacity = '0';
          card.classList.add('peeled');
          card.classList.remove('active');
        } else if (states[i] === 'peeling') {
          const peel = cardProgress / 0.95;
          card.style.transform = `translateY(${-120 * peel}px) scale(${1 - 0.2 * peel}) rotateX(${8 * peel}deg)`;
          card.style.opacity = 1 - peel;
          card.classList.remove('peeled');
          card.classList.toggle('active', isTop);
        } else {
          card.classList.remove('peeled');
          card.classList.toggle('active', isTop);
          let peeledCount = 0;
          for (let j = 0; j < i; j++) {
            if (states[j] === 'peeled') peeledCount++;
          }
          const stackIndex = i - peeledCount;
          card.style.transform = `translateY(${stackIndex * 8}px) scale(${1 - stackIndex * 0.03})`;
          card.style.opacity = stackIndex < 3 ? '1' : '0.5';
          card.style.zIndex = total - i;
        }
      });
    }

    window.addEventListener('scroll', updateStack, { passive: true });
    updateStack();
  }

  // ── Current year in footer ──────────────────
  document.querySelectorAll('.current-year').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

});
