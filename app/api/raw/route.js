export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const blogId = searchParams.get('blogId') || 'dayoffday_';

  const h = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, */*',
    'Accept-Language': 'ko-KR,ko;q=0.9',
    'Referer': 'https://blog.naver.com/',
  };

  const results = {};

  // 1) 블로그 프로필 (이미 확인된 작동 엔드포인트)
  const profileRes = await fetch(`https://m.blog.naver.com/api/blogs/${blogId}`, { headers: h });
  results.profile = await profileRes.json();

  // 2) 포스트 목록 - 첫 번째 아이템의 전체 필드 확인
  const postRes = await fetch(`https://m.blog.naver.com/api/blogs/${blogId}/post-list?categoryNo=0&page=1&pageSize=3`, { headers: h });
  const postData = await postRes.json();
  results.postListMeta = { totalCount: postData?.result?.totalCount, page: postData?.result?.page };
  results.firstPostKeys = postData?.result?.items?.[0] ? Object.keys(postData.result.items[0]) : [];
  results.firstPost = postData?.result?.items?.[0] || null;

  // 3) 이웃수 엔드포인트 후보들 테스트
  const neighborEndpoints = [
    `https://m.blog.naver.com/api/blogs/${blogId}/neighbor`,
    `https://m.blog.naver.com/api/blogs/${blogId}/neighbor-info`,
    `https://m.blog.naver.com/api/blogs/${blogId}/stat`,
    `https://m.blog.naver.com/api/blogs/${blogId}/statistics`,
    `https://m.blog.naver.com/api/blogs/${blogId}/overview`,
    `https://blog.naver.com/api/blogs/${blogId}/info`,
  ];
  results.neighborTests = {};
  await Promise.all(neighborEndpoints.map(async (url) => {
    try {
      const res = await fetch(url, { headers: h, signal: AbortSignal.timeout(4000) });
      const text = await res.text();
      let parsed = null;
      try { parsed = JSON.parse(text); } catch (_) {}
      const key = url.split('/').slice(-1)[0];
      results.neighborTests[key] = { status: res.status, url: res.url, isJson: !!parsed, snippet: text.slice(0, 200) };
    } catch (e) {
      const key = url.split('/').slice(-1)[0];
      results.neighborTests[key] = { error: e.message };
    }
  }));

  return Response.json(results);
}
