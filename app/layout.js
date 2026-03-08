import "./globals.css";

export const metadata = {
  title: "2주 투두 리스트",
  description: "개인용 맞춤 투두 앱",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
