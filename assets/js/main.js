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

/* ── Session Calendar ────────────────────────────────────── */
(function () {
  const table = document.getElementById('past-table');
  if (!table) return;

  const s    = CONFIG.stats || {};
  const MON  = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const DOWS = ['S','M','T','W','T','F','S'];

  const pastMap = {};
  (s.pastSessions || []).forEach(r => { pastMap[r.date] = r; });

  const soonSet = new Set(s.soonDates || []);

  const sessions = (typeof SESSION_DATA !== 'undefined') ? SESSION_DATA : [];
  const upcomingMap = {};
  sessions.forEach(sv => { upcomingMap[sv.date] = sv; });

  function renderMonth(year, month) {
    const firstDay  = new Date(year, month - 1, 1).getDay();
    const totalDays = new Date(year, month, 0).getDate();
    const mm = String(month).padStart(2, '0');
    let cells = '';

    for (let i = 0; i < firstDay; i++) {
      cells += '<div class="cal__cell cal__cell--empty"></div>';
    }
    for (let d = 1; d <= totalDays; d++) {
      const key = `${mm}.${String(d).padStart(2, '0')}`;
      let cls = 'cal__cell';
      let badge = '';

      if (pastMap[key]) {
        const c = pastMap[key].couples;
        cls += ' cal__cell--past';
        badge = `<span class="cal__badge">&#9829; ${c}</span>`;
      } else if (upcomingMap[key]) {
        const st  = upcomingMap[key].status;
        const lbl = st === 'RECRUITING' ? 'OPEN' : st === 'CLOSED' ? 'END' : 'SOON';
        cls += ` cal__cell--${st.toLowerCase()}`;
        badge = `<span class="cal__badge">${lbl}</span>`;
      } else if (soonSet.has(key)) {
        cls += ' cal__cell--soon';
        badge = `<span class="cal__badge">SOON</span>`;
      }

      cells += `<div class="${cls}">${badge}<span class="cal__day">${d}</span></div>`;
    }

    return `
      <div class="cal__month">
        <div class="cal__month-name">${MON[month - 1]}</div>
        <div class="cal__grid">
          ${DOWS.map(d => `<div class="cal__dow">${d}</div>`).join('')}
          ${cells}
        </div>
      </div>`;
  }

  table.innerHTML = `<div class="cal__wrap">${[10, 11, 12].map(m => renderMonth(2026, m)).join('')}</div>`;
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
