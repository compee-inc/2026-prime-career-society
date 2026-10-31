/* ============================================================
   sessions.js — 세션 모집현황 데이터 & 렌더링
   새 세션 추가 시 SESSION_DATA 배열에만 추가하면 됩니다.
   ============================================================ */

/* 2기(10.30) — 장소 사정으로 취소 (2026-10-28)
const SESSION_DATA = [
  {
    "id": "2026-10-30",
    "date": "10.30",
    "day": "FRI",
    "time": "19:00",
    "location": "영등포구 양평동 인근 · 카페 전체 대관",
    "status": "RECRUITING",
    "targetMen": 8,
    "targetWomen": 8,
    "men": [
      {
        "occupation": "변호사",
        "age": 91
      },
      {
        "occupation": "대기업",
        "age": 93
      },
      {
        "occupation": "개발자",
        "age": 93
      },
      {
        "occupation": "은행원",
        "age": 90
      }
    ],
    "women": [
      {
        "occupation": "약사",
        "age": 99
      },
      {
        "occupation": "대기업",
        "age": 96
      },
      {
        "occupation": "승무원",
        "age": 97
      },
      {
        "occupation": "금융유관기관",
        "age": 92
      },
      {
        "occupation": "공무원",
        "age": 94
      }
    ]
  }
];
*/
const SESSION_DATA = [
  {
    "id": "2026-11-12",
    "date": "11.12",
    "day": "THU",
    "time": "19:00",
    "location": "영등포구 양평동 인근 · 카페 전체 대관",
    "status": "RECRUITING",
    "targetMen": 8,
    "targetWomen": 8,
    "note": "최대 8:8 · 선착순이 아닌 프로필 검토로 구성",
    "men": [
      {
        "occupation": "의사",
        "age": 91
      },
      {
        "occupation": "대기업",
        "age": 90
      }
    ],
    "women": [
      {
        "occupation": "승무원",
        "age": 93
      },
      {
        "occupation": "대기업",
        "age": 97
      },
      {
        "occupation": "확인중",
        "age": 99
      }
    ]
  },
  {
    "id": "2026-11-19",
    "date": "11.19",
    "day": "THU",
    "time": "19:00",
    "location": "영등포구 양평동 인근 · 카페 전체 대관",
    "status": "RECRUITING",
    "targetMen": 8,
    "targetWomen": 8,
    "note": "최대 8:8 · 선착순이 아닌 프로필 검토로 구성",
    "men": [],
    "women": [
      {
        "occupation": "개발자",
        "age": 93
      },
      {
        "occupation": "확인중",
        "age": 96
      },
      {
        "occupation": "교사",
        "age": 95
      }
    ]
  },
  {
    "id": "2026-11-20",
    "date": "11.20",
    "day": "FRI",
    "time": "19:00",
    "location": "영등포구 양평동 인근 · 카페 전체 대관",
    "status": "RECRUITING",
    "targetMen": 8,
    "targetWomen": 8,
    "note": "최대 8:8 · 선착순이 아닌 프로필 검토로 구성",
    "men": [
      {
        "occupation": "금융 전문직",
        "age": 91
      }
    ],
    "women": []
  }
];

/* 지난 회차 기록 (화면에는 표시하지 않음)
[
  {
    "id": "2026-10-16",
    "date": "10.16",
    "day": "FRI",
    "time": "19:00",
    "location": "공덕역 인근",
    "status": "CLOSED",
    "targetMen": 6,
    "targetWomen": 6,
    "men": [
      {
        "occupation": "파일럿",
        "age": 91
      },
      {
        "occupation": "치과의사",
        "age": 93
      },
      {
        "occupation": "증권",
        "age": 94
      },
      {
        "occupation": "중견기업",
        "age": 95
      },
      {
        "occupation": "보험",
        "age": 92
      },
      {
        "occupation": "은행",
        "age": 94
      }
    ],
    "women": [
      {
        "occupation": "금융유관기관",
        "age": 93
      },
      {
        "occupation": "간호사",
        "age": 96
      },
      {
        "occupation": "대기업",
        "age": 97
      },
      {
        "occupation": "대기업",
        "age": 97
      },
      {
        "occupation": "교사",
        "age": 93
      },
      {
        "occupation": "금융유관기관",
        "age": 92
      }
    ]
  }
];
*/

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
  const age = p.age != null ? `${p.age}년생` : '확인 중';
  return `<li class="sc-row"><span class="sc-occ">${p.occupation}</span><span class="sc-age">${age}</span></li>`;
}

/* ── 남/여 컬럼 생성 ─────────────────────────────────────── */
function _colHTML(label, participants, target, status) {
  const count     = participants.length;
  const remaining = target - count;
  const isFull    = remaining <= 0 || status === 'FULL' || status === 'CLOSED';
  const isEmpty   = count === 0;

  const rows = isEmpty
    ? `<li class="sc-row sc-row--empty"><span class="sc-occ-empty">${status === 'RECRUITING' ? '신청 받는 중' : '모집 준비 중'}</span></li>`
    : participants.map(_participantRow).join('');

  const seatLabel = isFull
    ? `<span class="sc-seat-closed">마감</span>`
    : `<span class="sc-seat-remain">잔여 ${remaining}석</span>`;

  return `
<div class="sc-col">
  <h3 class="sc-col-title">${label}</h3>
  <div class="sc-col-labels" aria-hidden="true">
    <span>직업 / 직군</span><span>년생</span>
  </div>
  <ul class="sc-participants" aria-label="${label} 참가자 목록">${rows}</ul>
  <div class="sc-total">${seatLabel}</div>
</div>`;
}

/* ── 프리미엄 카드 HTML 생성 ─────────────────────────────── */
function _buildCard(s) {
  const isSoon = s.status === 'SOON';

  const columnsHTML = isSoon
    ? `<div class="sc-empty-state"><p>다음 회차는 11월 중 운영 예정이에요.</p><p>대기 신청을 해두시면 회차 오픈 즉시 문자로 가장 먼저 안내드려요.</p></div>`
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
      <p class="sc-datetime">${s.time ? `${s.date} (${s.day}) &nbsp;&middot;&nbsp; ${s.time}` : s.date}</p>
      <p class="sc-location">${s.location}</p>
      <p class="sc-status-text">${STATUS_LABEL[s.status] || s.status}</p>
    </header>

    ${columnsHTML}

    <footer class="sc-footer">
      <div class="sc-gold-line" aria-hidden="true"></div>
      <p class="sc-footer-text">${s.note || 'SELECTED MEMBERS'}</p>
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
