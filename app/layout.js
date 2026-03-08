import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata = {
  title: "2-Week Todo",
  description: "2주 단위 그룹별 할 일 관리",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={geist.variable}>
      <body>{children}</body>
    </html>
  );
}
