export const dynamic = 'force-dynamic';

function calcScore({ dayVisitorCount, monthlyPostCount, avgEngagement, suitability, quality }) {
  // 일방문자 수 (35점)
  let visitorScore = 5;
  if (dayVisitorCount >= 1000) visitorScore = 35;
  else if (dayVisitorCount >= 500) visitorScore = 25;
  else if (dayVisitorCount >= 200) visitorScore = 15;

  // 월 포스팅 수 (25점)
  let postScore = 3;
  if (monthlyPostCount >= 15) postScore = 25;
  else if (monthlyPostCount >= 8) postScore = 18;
  else if (monthlyPostCount >= 4) postScore = 10;

  // 평균 공감+댓글 합산 (15점)
  let engagementScore = 0;
  if (avgEngagement >= 20) engagementScore = 15;
  else if (avgEngagement >= 10) engagementScore = 10;
  else if (avgEngagement >= 5) engagementScore = 5;

  // 정성 평가 (25점): 적합도(0~15) + 퀄리티(0~10)
  const suitabilityScore = Math.min(15, Math.max(0, suitability));
  const qualityScore = Math.min(10, Math.max(0, quality));
  const qualitativeScore = suitabilityScore + qualityScore;

  const total = visitorScore + postScore + engagementScore + qualitativeScore;

  let grade, payback, gradeColor, resultComment;
  if (total >= 85) {
    grade = 'S'; payback = 100; gradeColor = '#7c3aed';
    resultComment = '참가비 전액(100%) 페이백 대상이에요';
  } else if (total >= 70) {
    grade = 'A'; payback = 70; gradeColor = '#2563eb';
    resultComment = '참가비의 70% 페이백 대상이에요';
  } else if (total >= 55) {
    grade = 'B'; payback = 50; gradeColor = '#0891b2';
    resultComment = '참가비의 50% 페이백 대상이에요';
  } else if (total >= 40) {
    grade = 'C'; payback = 30; gradeColor = '#16a34a';
    resultComment = '참가비의 30% 페이백 대상이에요';
  } else {
    grade = '탈락'; payback = 0; gradeColor = '#dc2626';
    resultComment = '체험단 기준 미달 — 일반 참가로 안내드려요';
  }

  return {
    total,
    grade,
    payback,
    gradeColor,
    resultComment,
    // 내부용 breakdown (외부 노출 금지)
    _breakdown: { visitorScore, postScore, engagementScore, qualitativeScore },
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const input = (searchParams.get('blogId') || '').trim();
  // 정성 평가 파라미터 (관리자 입력, 기본값 적용)
  const suitability = Number(searchParams.get('suitability') ?? 10);
  const quality = Number(searchParams.get('quality') ?? 7);

  if (!input) {
    return Response.json({ error: '블로그 ID 또는 URL을 입력해주세요' }, { status: 400 });
  }

  // URL에서 blogId 추출
  let blogId = input;
  const urlMatch = input.match(/blog\.naver\.com\/([^/?#\s]+)/);
  if (urlMatch) blogId = urlMatch[1];
  blogId = blogId.replace(/^@/, '').replace(/\/$/, '');

  const h = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, */*',
    'Accept-Language': 'ko-KR,ko;q=0.9',
    'Referer': 'https://blog.naver.com/',
  };

  const [profileRes, postRes1] = await Promise.all([
    fetch(`https://m.blog.naver.com/api/blogs/${blogId}`, { headers: h }),
    fetch(`https://m.blog.naver.com/api/blogs/${blogId}/post-list?categoryNo=0&page=1&pageSize=10`, { headers: h }),
  ]);

  if (!profileRes.ok) {
    return Response.json({ error: '블로그를 찾을 수 없어요' }, { status: 404 });
  }

  const profileData = await profileRes.json();
  if (!profileData?.isSuccess) {
    return Response.json({ error: '블로그 정보를 가져올 수 없어요' }, { status: 404 });
  }

  const profile = profileData.result;
  const blogName = profile.blogName || blogId;
  const nickName = profile.displayNickName || profile.nickName || '';
  const dayVisitorCount = profile.dayVisitorCount || 0;
  const totalVisitorCount = profile.totalVisitorCount || 0;
  const profileImage = profile.profileImagePath || null;

  // 최근 30일 포스팅 수 집계 (최대 3페이지)
  let allItems = [];
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  if (postRes1.ok) {
    const d = await postRes1.json();
    const items = d?.result?.items || [];
    allItems = [...items];

    if (items.length > 0 && items[items.length - 1].addDate >= thirtyDaysAgo) {
      const [r2, r3] = await Promise.all([
        fetch(`https://m.blog.naver.com/api/blogs/${blogId}/post-list?categoryNo=0&page=2&pageSize=10`, { headers: h }),
        fetch(`https://m.blog.naver.com/api/blogs/${blogId}/post-list?categoryNo=0&page=3&pageSize=10`, { headers: h }),
      ]);
      if (r2.ok) { const d2 = await r2.json(); allItems = [...allItems, ...(d2?.result?.items || [])]; }
      if (r3.ok) { const d3 = await r3.json(); allItems = [...allItems, ...(d3?.result?.items || [])]; }
    }
  }

  const monthlyPostCount = allItems.filter(p => p.addDate >= thirtyDaysAgo).length;

  const sample = allItems.slice(0, 10);
  const avgSympathy = sample.length > 0
    ? sample.reduce((s, p) => s + (p.sympathyCnt || 0), 0) / sample.length : 0;
  const avgComment = sample.length > 0
    ? sample.reduce((s, p) => s + (p.commentCnt || 0), 0) / sample.length : 0;
  const avgEngagement = avgSympathy + avgComment;

  const score = calcScore({ dayVisitorCount, monthlyPostCount, avgEngagement, suitability, quality });

  return Response.json({
    blogId,
    blogName,
    nickName,
    profileImage,
    stats: {
      dayVisitorCount,
      totalVisitorCount,
      monthlyPostCount,
      avgEngagement: Math.round(avgEngagement * 10) / 10,
    },
    qualitative: { suitability, quality },
    score: score.total,
    grade: score.grade,
    payback: score.payback,
    gradeColor: score.gradeColor,
    resultComment: score.resultComment,
  });
}
