export const dynamic = 'force-dynamic';

function calcScore({ subscriberCount, recentPostCount, avgSympathy, avgComment }) {
  // 구독자 수 (35점)
  let subScore = 0;
  if (subscriberCount >= 50000) subScore = 35;
  else if (subscriberCount >= 10000) subScore = 30;
  else if (subscriberCount >= 5000) subScore = 24;
  else if (subscriberCount >= 1000) subScore = 17;
  else if (subscriberCount >= 500) subScore = 11;
  else if (subscriberCount >= 100) subScore = 6;
  else if (subscriberCount >= 1) subScore = 3;

  // 최근 1개월 포스팅 (35점)
  let actScore = 0;
  if (recentPostCount >= 25) actScore = 35;
  else if (recentPostCount >= 20) actScore = 30;
  else if (recentPostCount >= 15) actScore = 24;
  else if (recentPostCount >= 10) actScore = 18;
  else if (recentPostCount >= 7) actScore = 12;
  else if (recentPostCount >= 4) actScore = 7;
  else if (recentPostCount >= 2) actScore = 4;
  else if (recentPostCount >= 1) actScore = 2;

  // 평균 공감 (20점)
  let sympScore = 0;
  if (avgSympathy >= 100) sympScore = 20;
  else if (avgSympathy >= 50) sympScore = 16;
  else if (avgSympathy >= 20) sympScore = 12;
  else if (avgSympathy >= 10) sympScore = 8;
  else if (avgSympathy >= 5) sympScore = 5;
  else if (avgSympathy >= 1) sympScore = 2;

  // 평균 댓글 (10점)
  let cmtScore = 0;
  if (avgComment >= 50) cmtScore = 10;
  else if (avgComment >= 20) cmtScore = 8;
  else if (avgComment >= 10) cmtScore = 6;
  else if (avgComment >= 5) cmtScore = 4;
  else if (avgComment >= 2) cmtScore = 2;
  else if (avgComment >= 1) cmtScore = 1;

  const total = subScore + actScore + sympScore + cmtScore;

  let grade, gradeColor, comment;
  if (total >= 85) { grade = 'S'; gradeColor = '#7c3aed'; comment = '최우선 선발 대상이에요'; }
  else if (total >= 70) { grade = 'A+'; gradeColor = '#2563eb'; comment = '체험단 선발 가능성 매우 높아요'; }
  else if (total >= 58) { grade = 'A'; gradeColor = '#0891b2'; comment = '체험단 선발 가능해요'; }
  else if (total >= 45) { grade = 'B+'; gradeColor = '#16a34a'; comment = '활동량을 조금 더 늘리면 좋아요'; }
  else if (total >= 33) { grade = 'B'; gradeColor = '#65a30d'; comment = '꾸준한 포스팅과 이웃 관리가 필요해요'; }
  else if (total >= 20) { grade = 'C'; gradeColor = '#d97706'; comment = '이웃 수와 활동량 보완이 필요해요'; }
  else { grade = 'D'; gradeColor = '#dc2626'; comment = '체험단 기준에 미달이에요'; }

  return { total, breakdown: { subScore, actScore, sympScore, cmtScore }, grade, gradeColor, comment };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const input = (searchParams.get('blogId') || '').trim();

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

  // 블로그 프로필 + 첫 페이지 포스트 병렬 요청
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
  const subscriberCount = profile.subscriberCount || 0;
  const dayVisitorCount = profile.dayVisitorCount || 0;
  const totalVisitorCount = profile.totalVisitorCount || 0;
  const profileImage = profile.profileImagePath || null;

  // 최근 30일 포스팅 수 집계 - 페이지 3개(30개)까지 확인
  let allItems = [];
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  if (postRes1.ok) {
    const d = await postRes1.json();
    const items = d?.result?.items || [];
    allItems = [...items];

    // 1페이지 최신 포스트가 30일 이내면 2~3페이지 추가 요청
    if (items.length > 0 && items[items.length - 1].addDate >= thirtyDaysAgo) {
      const [r2, r3] = await Promise.all([
        fetch(`https://m.blog.naver.com/api/blogs/${blogId}/post-list?categoryNo=0&page=2&pageSize=10`, { headers: h }),
        fetch(`https://m.blog.naver.com/api/blogs/${blogId}/post-list?categoryNo=0&page=3&pageSize=10`, { headers: h }),
      ]);
      if (r2.ok) { const d2 = await r2.json(); allItems = [...allItems, ...(d2?.result?.items || [])]; }
      if (r3.ok) { const d3 = await r3.json(); allItems = [...allItems, ...(d3?.result?.items || [])]; }
    }
  }

  const recentPostCount = allItems.filter(p => p.addDate >= thirtyDaysAgo).length;
  const totalFetchedPosts = allItems.length;

  const sample = allItems.slice(0, 10);
  const avgSympathy = sample.length > 0
    ? sample.reduce((s, p) => s + (p.sympathyCnt || 0), 0) / sample.length : 0;
  const avgComment = sample.length > 0
    ? sample.reduce((s, p) => s + (p.commentCnt || 0), 0) / sample.length : 0;

  const score = calcScore({ subscriberCount, recentPostCount, avgSympathy, avgComment });

  return Response.json({
    blogId,
    blogName,
    nickName,
    profileImage,
    stats: {
      subscriberCount,
      dayVisitorCount,
      totalVisitorCount,
      recentPostCount,
      totalFetchedPosts,
      avgSympathy: Math.round(avgSympathy * 10) / 10,
      avgComment: Math.round(avgComment * 10) / 10,
    },
    score: score.total,
    breakdown: score.breakdown,
    grade: score.grade,
    gradeColor: score.gradeColor,
    comment: score.comment,
  });
}
