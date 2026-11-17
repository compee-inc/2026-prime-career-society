'use client';

import { useState } from 'react';

function fmt(n) {
  if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '만';
  return Number(n).toLocaleString('ko-KR');
}

export default function Home() {
  const [input, setInput] = useState('');
  const [suitability, setSuitability] = useState(10);
  const [quality, setQuality] = useState(7);
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
      const params = new URLSearchParams({
        blogId: input.trim(),
        suitability,
        quality,
      });
      const res = await fetch(`/api/check?${params}`);
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
        <h1>로테이션 소개팅<br />블로그 체험단 심사</h1>
        <p>블로그 ID 또는 URL을 입력하면 자동 분석해드려요</p>
      </div>

      <form onSubmit={handleCheck}>
        <div className="search-box">
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
        </div>

        {/* 정성 평가 — 관리자 입력 항목 */}
        <div className="qualitative-box">
          <div className="qualitative-label">정성 평가 <span className="admin-badge">관리자</span></div>
          <div className="qualitative-row">
            <label>
              연령대·직업군 적합도
              <span className="q-max">/ 15점</span>
            </label>
            <div className="q-input-wrap">
              <input
                type="range" min="0" max="15" value={suitability}
                onChange={e => setSuitability(Number(e.target.value))}
                className="q-range"
              />
              <span className="q-val">{suitability}점</span>
            </div>
          </div>
          <div className="qualitative-row">
            <label>
              글·사진 퀄리티
              <span className="q-max">/ 10점</span>
            </label>
            <div className="q-input-wrap">
              <input
                type="range" min="0" max="10" value={quality}
                onChange={e => setQuality(Number(e.target.value))}
                className="q-range"
              />
              <span className="q-val">{quality}점</span>
            </div>
          </div>
        </div>
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
          {/* 프로필 */}
          <div className="card">
            <div className="profile-row">
              {result.profileImage && (
                <img src={result.profileImage} alt="" className="profile-img" />
              )}
              <div>
                <div className="blog-name">{result.blogName}</div>
                <div className="blog-id">
                  {result.nickName && `${result.nickName} · `}blog.naver.com/{result.blogId}
                </div>
              </div>
            </div>

            {/* 등급 + 페이백 */}
            <div className="grade-row">
              <div className="grade-circle" style={{ borderColor: result.gradeColor, color: result.gradeColor }}>
                <span className="grade-letter">{result.grade}</span>
                <span className="grade-sub">등급</span>
              </div>
              <div className="grade-detail">
                {result.grade !== '탈락' ? (
                  <>
                    <div className="payback-num" style={{ color: result.gradeColor }}>
                      {result.payback}% 페이백
                    </div>
                    <div className="payback-desc">{result.resultComment}</div>
                  </>
                ) : (
                  <div className="payback-desc" style={{ color: result.gradeColor }}>
                    {result.resultComment}
                  </div>
                )}
              </div>
            </div>

            {/* 안내 문구 (외부 공개용) */}
            <div className="policy-notice">
              내부 심사 기준에 따라 30%~100% 차등 페이백 등급이 안내됩니다.
            </div>
          </div>

          {/* 블로그 현황 */}
          <div className="card">
            <div className="card-section-title">블로그 현황</div>
            <div className="stat-grid">
              <div className="stat-item">
                <div className="stat-value">{fmt(result.stats.dayVisitorCount)}</div>
                <div className="stat-name">오늘 방문자</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{result.stats.monthlyPostCount}개</div>
                <div className="stat-name">최근 30일 포스팅</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{result.stats.avgEngagement}</div>
                <div className="stat-name">평균 공감+댓글</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{fmt(result.stats.totalVisitorCount)}</div>
                <div className="stat-name">누적 방문자</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{result.qualitative.suitability}점</div>
                <div className="stat-name">적합도</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{result.qualitative.quality}점</div>
                <div className="stat-name">퀄리티</div>
              </div>
            </div>
          </div>

          {/* 운영 정책 안내 */}
          <div className="card policy-card">
            <div className="policy-title">체험단 페이백 안내</div>
            <div className="policy-row">
              <span>결제</span>
              <span>참가비 전액 선결제</span>
            </div>
            <div className="policy-row">
              <span>페이백 조건</span>
              <span>행사 종료 후 포스팅 검수 완료 시</span>
            </div>
            <div className="policy-row">
              <span>페이백 범위</span>
              <span>심사 등급에 따라 30% ~ 100%</span>
            </div>
            <div className="policy-row" style={{ borderBottom: 'none' }}>
              <span>탈락 시</span>
              <span>페이백 없이 일반 참가로 안내</span>
            </div>
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
