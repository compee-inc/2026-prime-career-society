/* ============================================================
   sessions.js — 세션 모집현황 데이터 & 렌더링
   새 세션 추가 시 SESSION_DATA 배열에만 추가하면 됩니다.
   ============================================================ */

const SESSION_DATA = [
  {
    "id": "2026-10-16",
    "date": "10.16",
    "day": "FRI",
    "time": "19:00",
    "location": "공덕역 인근",
    "status": "RECRUITING",
    "targetMen": 6,
    "targetWomen": 6,
    "men": [],
    "women": []
  }
];

/* ── 내부 상수 ───────────────────────────────────────────── */
const STATUS_LABEL = {
  RECRUITING:  'NOW RECRUITING',
  ALMOST_FULL: 'ALMOST FULL',
  FULL:        'FULL',
  CLOSED:      'CLOSED',
  SOON:        'OPENING SOON',
};

const TRANSITION_MS = 220;
let _currentIndex = -1;

/* ── 참가자 행 생성 ──────────────────────────────────────── */
function _participantRow(p) {
  const age = p.age != null ? p.age : '확인 중';
  return `<li class="sc-row"><span class="sc-occ">${p.occupation}</span><span class="sc-age">${age}</span></li>`;
}

/* ── 남/여 컬럼 생성 ─────────────────────────────────────── */
function _colHTML(label, participants, target, status) {
  const count     = participants.length;
  const remaining = target - count;
  const isFull    = remaining <= 0 || status === 'FULL' || status === 'CLOSED';
  const isEmpty   = count === 0;

  const rows = isEmpty
    ? `<li class="sc-row sc-row--empty"><span class="sc-occ-empty">모집 준비 중</span></li>`
    : participants.map(_participantRow).join('');

  const seatLabel = isFull
    ? `<span class="sc-seat-closed">마감</span>`
    : `<span class="sc-seat-remain">잔여 ${remaining}석</span>`;

  return `
<div class="sc-col">
  <h3 class="sc-col-title">${label} <span class="sc-col-max">MAX ${target}</span></h3>
  <div class="sc-col-labels" aria-hidden="true">
    <span>직업 / 직군</span><span>나이</span>
  </div>
  <ul class="sc-participants" aria-label="${label} 참가자 목록">${rows}</ul>
  <div class="sc-total">${seatLabel}</div>
</div>`;
}

/* ── 프리미엄 카드 HTML 생성 ─────────────────────────────── */
function _buildCard(s) {
  const isSoon = s.status === 'SOON' || (s.men.length === 0 && s.women.length === 0);

  const columnsHTML = isSoon
    ? `<div class="sc-empty-state"><p>모집 준비 중입니다.</p><p>일정이 확정되면 공개됩니다.</p></div>`
    : `<div class="sc-columns">
        ${_colHTML('MEN',   s.men,   s.targetMen,   s.status)}
        <div class="sc-col-sep" aria-hidden="true"></div>
        ${_colHTML('WOMEN', s.women, s.targetWomen, s.status)}
       </div>`;

  return `
<div class="sc-premium sc-status--${s.status.toLowerCase()}">
  <span class="sc-corner sc-corner--tl" aria-hidden="true"></span>
  <span class="sc-corner sc-corner--tr" aria-hidden="true"></span>
  <span class="sc-corner sc-corner--bl" aria-hidden="true"></span>
  <span class="sc-corner sc-corner--br" aria-hidden="true"></span>

  <div class="sc-body">
    <header class="sc-header">
      <p class="sc-brand-name">2026 PRIVATE DATING</p>
      <div class="sc-gold-line" aria-hidden="true"></div>
      <p class="sc-datetime">${s.date} (${s.day}) &nbsp;&middot;&nbsp; ${s.time}</p>
      <p class="sc-location">${s.location}</p>
      <p class="sc-status-text">${STATUS_LABEL[s.status] || s.status}</p>
    </header>

    ${columnsHTML}

    <footer class="sc-footer">
      <div class="sc-gold-line" aria-hidden="true"></div>
      <p class="sc-footer-text">SELECTED MEMBERS</p>
    </footer>
  </div>
</div>`;
}

/* ── 카드 렌더링 (트랜지션 포함) ─────────────────────────── */
function _renderCard(index, animate) {
  const wrap = document.getElementById('session-card');
  if (!wrap) return;

  const doRender = () => {
    wrap.innerHTML = _buildCard(SESSION_DATA[index]);
  };

  if (animate && wrap.innerHTML !== '') {
    wrap.classList.add('st-fading');
    setTimeout(() => {
      doRender();
      wrap.classList.remove('st-fading');
    }, TRANSITION_MS);
  } else {
    doRender();
  }
}

/* ── 탭 렌더링 ───────────────────────────────────────────── */
function _renderTabs() {
  const tabsEl = document.getElementById('session-tabs');
  if (!tabsEl) return;

  tabsEl.innerHTML = SESSION_DATA.map((s, i) => `
    <button
      class="st-tab${i === 0 ? ' is-active' : ''}"
      data-index="${i}"
      role="tab"
      aria-selected="${i === 0}"
      aria-label="${s.date} ${s.day} 세션"
    >${s.date} <span class="st-tab-day">${s.day}</span></button>
  `).join('');

  tabsEl.addEventListener('click', e => {
    const btn = e.target.closest('.st-tab');
    if (!btn) return;
    const idx = parseInt(btn.dataset.index, 10);
    if (idx === _currentIndex) return;

    _currentIndex = idx;
    tabsEl.querySelectorAll('.st-tab').forEach((t, i) => {
      t.classList.toggle('is-active', i === idx);
      t.setAttribute('aria-selected', i === idx ? 'true' : 'false');
    });
    _renderCard(idx, true);
  });
}

/* ── 초기화 ──────────────────────────────────────────────── */
(function initSessions() {
  if (!document.getElementById('session-tabs')) return;
  if (!SESSION_DATA || SESSION_DATA.length === 0) return;

  _currentIndex = 0;
  _renderTabs();
  _renderCard(0, false);
})();
