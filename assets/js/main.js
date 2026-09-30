/* ============================================================
   2026 PRIVATE DATING — main.js (slide layout)
   ============================================================ */

/* ── CONFIG ─────────────────────────────────────────────────
   운영 설정: applyUrl, formUrl, sns, sessions 만 수정
   ─────────────────────────────────────────────────────────── */
const CONFIG = {
  applyUrl: '',   // 참가 신청 URL (비워두면 알림 표시)
  formUrl:  '',   // 구글폼 URL (비워두면 알림 표시)

  sns: {
    instagram: 'https://instagram.com/2026privatedating',
    threads:   'https://threads.net/@2026privatedating',
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

/* ── Slide Engine ────────────────────────────────────────── */
const slides    = $$('.slide');
const totalSlides = slides.length;
let current = 0;
let isAnimating = false;

const nav      = $('#site-nav');
const dotNav   = $('#dot-nav');
const arrowNav = $('#arrow-nav');
const curEl    = $('#cur-num');
const totEl    = $('#tot-num');
const prevBtn  = $('#prev-btn');
const nextBtn  = $('#next-btn');

// light-theme slides (change nav/dots color accordingly)
const LIGHT_SLIDES = new Set([1, 3, 5, 7]);
const WHITE_SLIDES = new Set([6, 8]);

function pad(n) { return String(n).padStart(2, '0'); }

function updateUI(idx) {
  curEl.textContent = pad(idx + 1);

  // nav theme
  const isLight = LIGHT_SLIDES.has(idx) || WHITE_SLIDES.has(idx);
  nav.classList.toggle('site-nav--light', isLight);
  dotNav.classList.toggle('dot-nav--light', isLight);
  arrowNav.classList.toggle('arrow-nav--light', isLight);

  // dots
  $$('.dot', dotNav).forEach((d, i) => d.classList.toggle('is-active', i === idx));

  // arrows
  prevBtn.disabled = idx === 0;
  nextBtn.disabled = idx === totalSlides - 1;
}

function goTo(n, direction = 1) {
  if (n === current || isAnimating) return;
  if (n < 0 || n >= totalSlides) return;

  isAnimating = true;

  const prevSlide = slides[current];
  const nextSlide = slides[n];

  // animate out
  prevSlide.classList.add('is-prev');
  prevSlide.classList.remove('is-active');

  // set enter direction before adding active
  nextSlide.style.transform = `translateY(${direction > 0 ? '20px' : '-20px'})`;
  nextSlide.style.opacity = '0';

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      nextSlide.style.transform = '';
      nextSlide.style.opacity = '';
      nextSlide.classList.add('is-active');

      current = n;
      updateUI(n);

      setTimeout(() => {
        prevSlide.classList.remove('is-prev');
        isAnimating = false;
      }, 520);
    });
  });
}

function goNext() { goTo(current + 1, 1); }
function goPrev() { goTo(current - 1, -1); }

/* ── Build dot nav ───────────────────────────────────────── */
(function buildDots() {
  totEl.textContent = pad(totalSlides);

  slides.forEach((_, i) => {
    const btn = document.createElement('button');
    btn.className = 'dot' + (i === 0 ? ' is-active' : '');
    btn.setAttribute('aria-label', `${pad(i + 1)}번 슬라이드`);
    btn.addEventListener('click', () => goTo(i, i > current ? 1 : -1));
    dotNav.appendChild(btn);
  });
})();

/* ── Arrow buttons ───────────────────────────────────────── */
nextBtn?.addEventListener('click', goNext);
prevBtn?.addEventListener('click', goPrev);

/* ── Keyboard navigation ─────────────────────────────────── */
document.addEventListener('keydown', e => {
  if ($('.mobile-menu.is-open') || $('.faq-list:focus-within')) return;

  if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); goNext(); }
  if (e.key === 'ArrowUp'   || e.key === 'PageUp')   { e.preventDefault(); goPrev(); }
});

/* ── Touch / swipe ───────────────────────────────────────── */
(function initSwipe() {
  let startY = 0;
  let startX = 0;

  document.addEventListener('touchstart', e => {
    startY = e.touches[0].clientY;
    startX = e.touches[0].clientX;
  }, { passive: true });

  document.addEventListener('touchend', e => {
    const dy = startY - e.changedTouches[0].clientY;
    const dx = startX - e.changedTouches[0].clientX;
    if (Math.abs(dy) < 40 || Math.abs(dy) < Math.abs(dx)) return;
    dy > 0 ? goNext() : goPrev();
  }, { passive: true });
})();

/* ── Wheel navigation ────────────────────────────────────── */
(function initWheel() {
  let lastWheel = 0;

  document.addEventListener('wheel', e => {
    const now = Date.now();
    if (now - lastWheel < 800) return;
    if (Math.abs(e.deltaY) < 20) return;
    lastWheel = now;
    e.deltaY > 0 ? goNext() : goPrev();
  }, { passive: true });
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
  };

  btn.addEventListener('click', () => {
    const open = btn.classList.toggle('is-open');
    menu.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
  });

  $$('.mm-link', menu).forEach(link => {
    link.addEventListener('click', () => {
      const idx = parseInt(link.dataset.goto, 10);
      if (!isNaN(idx)) goTo(idx, idx > current ? 1 : -1);
      close();
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) close();
  });
})();

/* ── Apply button binding ────────────────────────────────── */
(function bindApply() {
  $$('.js-apply').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      if (CONFIG.applyUrl) {
        window.open(CONFIG.applyUrl, '_blank', 'noopener,noreferrer');
      } else {
        alert('신청 페이지를 준비 중입니다.\n인스타그램 DM으로 문의해 주세요.');
      }
    });
  });
})();

/* ── Google Form button binding ──────────────────────────── */
(function bindForm() {
  $$('.js-form').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      if (CONFIG.formUrl) {
        window.open(CONFIG.formUrl, '_blank', 'noopener,noreferrer');
      } else {
        alert('구글폼 링크를 준비 중입니다.\n인스타그램 DM으로 문의해 주세요.');
      }
    });
  });
})();

/* ── SNS URL binding ─────────────────────────────────────── */
(function bindSns() {
  $$('.js-instagram').forEach(el => el.setAttribute('href', CONFIG.sns.instagram));
  $$('.js-threads').forEach(el => el.setAttribute('href', CONFIG.sns.threads));
})();

/* ── Session cards renderer ──────────────────────────────── */
(function renderSessions() {
  const grid = $('#sessions-grid');
  if (!grid) return;

  if (!CONFIG.sessions?.length) {
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
<article class="session-card">
  <div>
    <span class="session-card__badge session-card__badge--${s.status}">${LABELS[s.status] ?? s.status}</span>
    <h3 class="session-card__name">${s.name}</h3>
    <p class="session-card__meta">${s.date} · ${s.venue}<br>${s.theme}</p>
  </div>
  <div class="session-card__count">
    <span class="session-card__count-num">${countNum}</span>
    <span class="session-card__count-label">${countLbl}</span>
  </div>
</article>`.trim();
  }).join('');
})();

/* ── Priority item accordion ─────────────────────────────── */
(function initPriority() {
  $$('.priority-item').forEach(item => {
    const activate = () => {
      const isActive = item.classList.contains('is-active');
      $$('.priority-item.is-active').forEach(el => el.classList.remove('is-active'));
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
  $$('.faq-q').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item   = trigger.closest('.faq-item');
      const isOpen = item.classList.contains('is-open');

      $$('.faq-item.is-open').forEach(el => {
        el.classList.remove('is-open');
        el.querySelector('.faq-q')?.setAttribute('aria-expanded', 'false');
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

  // FAQ 슬라이드 내에서 스크롤 시 슬라이드 전환 방지
  const faqList = $('.faq-list');
  if (faqList) {
    faqList.addEventListener('wheel', e => e.stopPropagation(), { passive: true });
    faqList.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });
    faqList.addEventListener('touchend', e => e.stopPropagation(), { passive: true });
  }
})();
