import './globals.css';

export const metadata = {
  title: '네이버 블로그 체험단 점수 체커',
  description: '네이버 블로그의 체험단 적합도를 자동으로 분석해드려요',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
