import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "전구 밝기 실험실",
  description: "전지의 연결에 따른 전구의 밝기 비교 실험 장치 시뮬레이션",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen bg-slate-50">{children}</body>
    </html>
  );
}