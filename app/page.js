'use client';

import { useState } from 'react';

function fmt(n) {
  if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '만';
  return Number(n).toLocaleString('ko-KR');
}

export default function Home() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleCheck(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const res = await fetch(`/api/check?blogId=${encodeURIComponent(input.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '오류가 발생했어요');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <div className="header">
        <h1>네이버 블로그 체험단 점수</h1>
        <p>블로그 ID 또는 URL을 입력하면 자동 분석해드려요</p>
      </div>

      <form className="search-box" onSubmit={handleCheck}>
        <input
          className="search-input"
          type="text"
          placeholder="블로그 ID 또는 URL 입력"
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
        />
        <button className="search-btn" type="submit" disabled={loading || !input.trim()}>
          분석
        </button>
      </form>

      {loading && (
        <div className="loading">
          <div className="spinner" />
          블로그 분석 중이에요...
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}

      {result && (
        <>
          {/* 프로필 + 점수 */}
          <div className="card">
            <div className="profile-row">
              {result.profileImage && (
                <img src={result.profileImage} alt="" className="profile-img" />
              )}
              <div>
                <div className="blog-name">{result.blogName}</div>
                <div className="blog-id">{result.nickName && `${result.nickName} · `}blog.naver.com/{result.blogId}</div>
              </div>
            </div>

            <div className="score-row">
              <div className="score-circle" style={{ color: result.gradeColor, borderColor: result.gradeColor }}>
                <span className="score-num">{result.score}</span>
                <span className="score-label">/ 100</span>
              </div>
              <div className="grade-info">
                <div className="grade-badge" style={{ background: result.gradeColor }}>{result.grade}등급</div>
                <div className="grade-comment">{result.comment}</div>
              </div>
            </div>

            {/* 점수 바 */}
            <div style={{ marginTop: 4 }}>
              {[
                { label: '구독자/이웃 수', score: result.breakdown.subScore, max: 35, color: '#0071e3' },
                { label: '최근 1개월 활동', score: result.breakdown.actScore, max: 35, color: '#34c759' },
                { label: '평균 공감 수', score: result.breakdown.sympScore, max: 20, color: '#ff9500' },
                { label: '평균 댓글 수', score: result.breakdown.cmtScore, max: 10, color: '#ff3b30' },
              ].map(({ label, score, max, color }) => (
                <div className="score-bar-wrap" key={label} style={{ marginTop: 10 }}>
                  <div className="score-bar-label">
                    <span>{label}</span>
                    <span>{score} / {max}점</span>
                  </div>
                  <div className="score-bar-bg">
                    <div className="score-bar-fill" style={{ width: `${(score / max) * 100}%`, background: color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 통계 카드 */}
          <div className="card">
            <div className="stat-grid">
              <div className="stat-item">
                <div className="stat-value">{fmt(result.stats.subscriberCount)}</div>
                <div className="stat-name">구독자 수</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{result.stats.recentPostCount}개</div>
                <div className="stat-name">최근 30일 포스팅</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{fmt(result.stats.dayVisitorCount)}</div>
                <div className="stat-name">오늘 방문자</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{fmt(result.stats.totalVisitorCount)}</div>
                <div className="stat-name">누적 방문자</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{result.stats.avgSympathy}</div>
                <div className="stat-name">평균 공감</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{result.stats.avgComment}</div>
                <div className="stat-name">평균 댓글</div>
              </div>
            </div>
          </div>

          {/* 채점 기준 */}
          <div className="card">
            <div className="criteria-title">채점 기준 (100점)</div>
            <div className="criteria-row"><span>구독자 수 (35점)</span><span>1만+ = 30점, 5천+ = 24점, 1천+ = 17점</span></div>
            <div className="criteria-row"><span>월 포스팅 (35점)</span><span>20개+ = 30점, 10개+ = 18점, 4개+ = 7점</span></div>
            <div className="criteria-row"><span>평균 공감 (20점)</span><span>50+ = 16점, 20+ = 12점, 10+ = 8점</span></div>
            <div className="criteria-row"><span>평균 댓글 (10점)</span><span>20+ = 8점, 10+ = 6점, 5+ = 4점</span></div>
          </div>
        </>
      )}

      {!result && !loading && !error && (
        <div className="hint">
          블로그 ID (예: <strong>myblog</strong>) 또는<br />
          URL (예: <strong>blog.naver.com/myblog</strong>) 을 입력해주세요
        </div>
      )}
    </main>
  );
}
