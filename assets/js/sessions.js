/* ============================================================
   sessions.js â ì¸ì ëª¨ì§íí© ë°ì´í° & ë ëë§
   ì ì¸ì ì¶ê° ì SESSION_DATA ë°°ì´ìë§ ì¶ê°íë©´ ë©ëë¤.
   ============================================================ */

const SESSION_DATA = [
  {
    "id": "2026-10-05",
    "date": "10.05",
    "day": "SUN",
    "time": "19:00",
    "location": "공덕역 인근",
    "status": "RECRUITING",
    "targetMen": 8,
    "targetWomen": 8,
    "men": [
      {
        "occupation": "금융투자",
        "age": 30
      },
      {
        "occupation": "대기업",
        "age": 33
      },
      {
        "occupation": "SK계열사",
        "age": 34
      },
      {
        "occupation": "현대계열사",
        "age": 34
      },
      {
        "occupation": "은행",
        "age": 32
      }
    ],
    "women": [
      {
        "occupation": "사업",
        "age": 37
      },
      {
        "occupation": "약사",
        "age": 37
      },
      {
        "occupation": "대기업",
        "age": 36
      },
      {
        "occupation": "공무원",
        "age": 34
      },
      {
        "occupation": "의료직",
        "age": 33
      }
    ]
  },
  {
    "id": "2026-10-09",
    "date": "10.09",
    "day": "FRI",
    "time": "19:30",
    "location": "공덕역 인근",
    "status": "SOON",
    "targetMen": 8,
    "targetWomen": 8,
    "men": [],
    "women": []
  },
  {
    "id": "2026-10-11",
    "date": "10.11",
    "day": "SUN",
    "time": "19:00",
    "location": "공덕역 인근",
    "status": "SOON",
    "targetMen": 8,
    "targetWomen": 8,
    "men": [],
    "women": []
  }
];

/* ââ ë´ë¶ ìì âââââââââââââââââââââââââââââââââââââââââââââ */
const STATUS_LABEL = {
  RECRUITING:  'NOW RECRUITING',
  ALMOST_FULL: 'ALMOST FULL',
  FULL:        'FULL',
  CLOSED:      'CLOSED',
  SOON:        'OPENING SOON',
};

const TRANSITION_MS = 220;
let _currentIndex = -1;

/* ââ ì°¸ê°ì í ìì± ââââââââââââââââââââââââââââââââââââââââ */
function _participantRow(p) {
  const age = p.age != null ? p.age : 'íì¸ ì¤';
  return `<li class="sc-row"><span class="sc-occ">${p.occupation}</span><span class="sc-age">${age}</span></li>`;
}

/* ââ ë¨/ì¬ ì»¬ë¼ ìì± âââââââââââââââââââââââââââââââââââââââ */
function _colHTML(label, participants, target) {
  const count = participants.length;
  const isEmpty = count === 0;

  const rows = isEmpty
    ? `<li class="sc-row sc-row--empty"><span class="sc-occ-empty">ëª¨ì§ ì¤ë¹ ì¤</span></li>`
    : participants.map(_participantRow).join('');

  return `
<div class="sc-col">
  <h3 class="sc-col-title">${label}</h3>
  <div class="sc-col-labels" aria-hidden="true">
    <span>ì§ì / ì§êµ°</span><span>ëì´</span>
  </div>
  <ul class="sc-participants" aria-label="${label} ì°¸ê°ì ëª©ë¡">${rows}</ul>
  <div class="sc-total">
    <span class="sc-total-label">TOTAL</span>
    <span class="sc-total-count">${String(count).padStart(2,'0')} / ${String(target).padStart(2,'0')}</span>
  </div>
</div>`;
}

/* ââ íë¦¬ë¯¸ì ì¹´ë HTML ìì± âââââââââââââââââââââââââââââââ */
function _buildCard(s) {
  const isSoon = s.status === 'SOON' || (s.men.length === 0 && s.women.length === 0);

  const columnsHTML = isSoon
    ? `<div class="sc-empty-state"><p>ëª¨ì§ ì¤ë¹ ì¤ìëë¤.</p><p>ì¼ì ì´ íì ëë©´ ê³µê°ë©ëë¤.</p></div>`
    : `<div class="sc-columns">
        ${_colHTML('MEN',   s.men,   s.targetMen)}
        <div class="sc-col-sep" aria-hidden="true"></div>
        ${_colHTML('WOMEN', s.women, s.targetWomen)}
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
      <p class="sc-datetime">${s.date} (${s.day}) &nbsp;Â·&nbsp; ${s.time}</p>
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

/* ââ ì¹´ë ë ëë§ (í¸ëì§ì í¬í¨) âââââââââââââââââââââââââââ */
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

/* ââ í­ ë ëë§ âââââââââââââââââââââââââââââââââââââââââââââ */
function _renderTabs() {
  const tabsEl = document.getElementById('session-tabs');
  if (!tabsEl) return;

  tabsEl.innerHTML = SESSION_DATA.map((s, i) => `
    <button
      class="st-tab${i === 0 ? ' is-active' : ''}"
      data-index="${i}"
      role="tab"
      aria-selected="${i === 0}"
      aria-label="${s.date} ${s.day} ì¸ì"
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

/* ââ ì´ê¸°í ââââââââââââââââââââââââââââââââââââââââââââââââ */
(function initSessions() {
  if (!document.getElementById('session-tabs')) return;
  if (!SESSION_DATA || SESSION_DATA.length === 0) return;

  _currentIndex = 0;
  _renderTabs();
  _renderCard(0, false);
})();
