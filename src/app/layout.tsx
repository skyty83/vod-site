import type { Metadata } from "next";
import { Suspense } from "react";
import Providers from "./providers";
import "./globals.css";
import Header from "@/components/Header";
import MobileBottomNav from "@/components/MobileBottomNav";

export const metadata: Metadata = {
  title: "喵喵影视 - 在线视频",
  description: "免费在线观看最新电影、电视剧、综艺、动漫、体育赛事",
  keywords: "在线视频,电影,电视剧,综艺,动漫,篮球,足球,免费观看",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600;700;900&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/logo.png" />
      </head>
      <body className="min-h-screen bg-card-bg dark:bg-[#02050a] text-foreground antialiased transition-colors duration-300 pb-32 lg:pb-0">
        <Providers>
          <Suspense fallback={<div className="h-20" />}>
            <Header />
          </Suspense>
          <main className="min-h-screen">
            {children}
          </main>
          <MobileBottomNav />
        </Providers>
      </body>
    </html>
  );
}
