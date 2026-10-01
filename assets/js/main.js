/* ============================================================
   main.js — CONFIG은 data.js에서 로드됩니다
   ============================================================ */

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ── Nav scroll ──────────────────────────────────────────── */
(function () {
  const nav = $('.nav');
  if (!nav) return;
  let ticking = false;
  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => { nav.classList.toggle('nav--scrolled', window.scrollY > 40); ticking = false; });
      ticking = true;
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ── Hamburger ───────────────────────────────────────────── */
(function () {
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
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();

/* ── Smooth scroll ───────────────────────────────────────── */
(function () {
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const navH = $('.nav')?.offsetHeight ?? 64;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navH - 8, behavior: 'smooth' });
    });
  });
})();

/* ── Apply ───────────────────────────────────────────────── */
(function () {
  $$('.js-apply').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      if (CONFIG.applyUrl) window.open(CONFIG.applyUrl, '_blank', 'noopener,noreferrer');
      else alert('신청 페이지를 준비 중입니다.\n인스타그램 DM으로 문의해 주세요.');
    });
  });
})();

/* ── Google Form ─────────────────────────────────────────── */
(function () {
  $$('.js-form').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      if (CONFIG.formUrl) window.open(CONFIG.formUrl, '_blank', 'noopener,noreferrer');
      else alert('구글폼 링크를 준비 중입니다.\n인스타그램 DM으로 문의해 주세요.');
    });
  });
})();

/* ── SNS ─────────────────────────────────────────────────── */
(function () {
  $$('.js-instagram').forEach(el => el.setAttribute('href', CONFIG.sns.instagram));
  $$('.js-threads').forEach(el => el.setAttribute('href', CONFIG.sns.threads));
})();

/* Sessions 렌더링은 sessions.js 에서 처리합니다 */

/* ── Past Sessions ───────────────────────────────────────── */
(function () {
  const totalEl = document.getElementById('past-total');
  const listEl  = document.getElementById('past-list');
  if (!totalEl || !listEl) return;

  const sessions = (CONFIG.stats?.pastSessions || []);
  const total    = sessions.reduce((sum, r) => sum + (r.couples || 0), 0);

  totalEl.innerHTML = `<span class="past__total-num">${total}</span><span class="past__total-label">TOTAL COUPLES</span>`;

  if (sessions.length === 0) {
    listEl.innerHTML = '<p class="past__empty">아직 진행된 세션이 없습니다.</p>';
    return;
  }

  listEl.innerHTML = sessions.map((r, i) =>
    `<div class="past__row">
      <span class="past__row-no">${String(i + 1).padStart(2, '0')}</span>
      <span class="past__row-date">${r.date}</span>
      <span class="past__row-day">${r.day}</span>
      <span class="past__row-couples">&#9829; ${r.couples} COUPLE${r.couples !== 1 ? 'S' : ''}</span>
    </div>`
  ).join('');
})();

/* ── FAQ ─────────────────────────────────────────────────── */
(function () {
  $$('.faq__q').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item   = trigger.closest('.faq__item');
      const isOpen = item.classList.contains('is-open');
      $$('.faq__item.is-open').forEach(el => {
        el.classList.remove('is-open');
        el.querySelector('.faq__q')?.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) { item.classList.add('is-open'); trigger.setAttribute('aria-expanded', 'true'); }
    });
    trigger.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); trigger.click(); } });
  });
})();

/* ── Scroll reveal ───────────────────────────────────────── */
(function () {
  if (!('IntersectionObserver' in window)) { $$('.reveal').forEach(el => el.classList.add('is-visible')); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } });
  }, { threshold: 0.1 });
  $$('.reveal').forEach(el => io.observe(el));
})();
