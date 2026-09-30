/* ============================================================
   2026 PRIVATE DATING — main.js
   ============================================================ */

/* ── CONFIG ─────────────────────────────────────────────────
   운영 설정. applyUrl, sns, sessions 만 수정하면 됩니다.
   ─────────────────────────────────────────────────────────── */
const CONFIG = {
  applyUrl: 'https://forms.gle/YOUR_GOOGLE_FORM_URL',  // ← 구글 폼 URL로 교체

  sns: {
    instagram: 'https://instagram.com/2026privatedating',  // ← 교체
    threads:   'https://threads.net/@2026privatedating',   // ← 교체
  },

  sessions: [
    {
      name: 'Session A — Seoul',
      date: '2026.10',
      venue: '서울 강남',
      theme: '첫 만남의 설렘',
      slots: 8,
      filled: 7,
      status: 'open',   // 'open' | 'closed' | 'soon'
    },
    {
      name: 'Session B — Seoul',
      date: '2026.11',
      venue: '서울 용산',
      theme: '조용한 대화의 밤',
      slots: 8,
      filled: 0,
      status: 'soon',
    },
    {
      name: 'Session C — Jeju',
      date: '2026.12',
      venue: '제주',
      theme: '섬에서의 하루',
      slots: 8,
      filled: 8,
      status: 'closed',
    },
  ],
};

/* ── Helpers ─────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ── Nav scroll ──────────────────────────────────────────── */
(function initNav() {
  const nav = $('.nav');
  if (!nav) return;

  let ticking = false;
  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        nav.classList.toggle('nav--scrolled', window.scrollY > 40);
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ── Hamburger / Mobile menu ─────────────────────────────── */
(function initHamburger() {
  const btn  = $('#hamburger');
  const menu = $('#mobile-menu');
  if (!btn || !menu) return;

  const close = () => {
    btn.classList.remove('is-open');
    menu.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  btn.addEventListener('click', () => {
    const open = btn.classList.toggle('is-open');
    menu.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  });

  $$('.nav__mobile-link', menu).forEach(el => el.addEventListener('click', close));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) close();
  });
})();

/* ── Apply URL binding ───────────────────────────────────── */
(function bindApplyLinks() {
  $$('.js-apply').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      if (CONFIG.applyUrl && !CONFIG.applyUrl.includes('YOUR_')) {
        window.open(CONFIG.applyUrl, '_blank', 'noopener,noreferrer');
      } else {
        alert('신청 페이지를 준비 중입니다.\n인스타그램 DM으로 문의해 주세요.');
      }
    });
  });
})();

/* ── SNS URL binding ─────────────────────────────────────── */
(function bindSnsLinks() {
  $$('.js-instagram').forEach(el => el.setAttribute('href', CONFIG.sns.instagram));
  $$('.js-threads').forEach(el => el.setAttribute('href', CONFIG.sns.threads));
})();

/* ── Session cards renderer ──────────────────────────────── */
(function renderSessions() {
  const grid = $('#sessions-grid');
  if (!grid) return;

  if (!CONFIG.sessions || CONFIG.sessions.length === 0) {
    grid.innerHTML = '<p class="sessions__empty">곧 세션 일정이 공개됩니다.</p>';
    return;
  }

  const LABELS = { open: '신청 가능', closed: '마감', soon: '오픈 예정' };

  grid.innerHTML = CONFIG.sessions.map(s => {
    const remaining = s.slots - s.filled;
    const isOpen    = s.status === 'open';
    const countNum  = isOpen ? remaining : (s.status === 'closed' ? '0' : '—');
    const countLbl  = isOpen ? '잔여' : (s.status === 'closed' ? '마감' : '준비 중');

    return `
<article class="session-card reveal">
  <div class="session-card__info">
    <span class="session-card__badge session-card__badge--${s.status}">${LABELS[s.status] ?? s.status}</span>
    <h3 class="session-card__name">${s.name}</h3>
    <p class="session-card__meta">${s.date} &nbsp;·&nbsp; ${s.venue}<br><em>${s.theme}</em></p>
  </div>
  <div class="session-card__count">
    <span class="session-card__count-num">${countNum}</span>
    <span class="session-card__count-label">${countLbl}</span>
  </div>
</article>`.trim();
  }).join('');

  // trigger reveal for dynamically inserted cards
  requestAnimationFrame(() => {
    const cards = $$('.reveal', grid);
    cards.forEach((el, i) => { el.style.transitionDelay = `${i * 0.09}s`; });
    observeReveal(cards);
  });
})();

/* ── Priority item accordion ─────────────────────────────── */
(function initPriority() {
  const items = $$('.priority__item');

  items.forEach(item => {
    const activate = () => {
      const isActive = item.classList.contains('is-active');
      items.forEach(el => el.classList.remove('is-active'));
      if (!isActive) item.classList.add('is-active');
    };

    item.addEventListener('click', activate);
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
    });
  });
})();

/* ── FAQ accordion ───────────────────────────────────────── */
(function initFaq() {
  $$('.faq__q').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item   = trigger.closest('.faq__item');
      const isOpen = item.classList.contains('is-open');

      $$('.faq__item.is-open').forEach(el => {
        el.classList.remove('is-open');
        el.querySelector('.faq__q')?.setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });

    trigger.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); trigger.click(); }
    });
  });
})();

/* ── Scroll reveal ───────────────────────────────────────── */
function observeReveal(targets) {
  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  targets.forEach(el => io.observe(el));
}

(function initReveal() {
  observeReveal($$('.reveal'));
})();

/* ── Smooth scroll ───────────────────────────────────────── */
(function initSmoothScroll() {
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;

      e.preventDefault();
      const navH = $('.nav')?.offsetHeight ?? 64;
      const top  = target.getBoundingClientRect().top + window.scrollY - navH - 8;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();
