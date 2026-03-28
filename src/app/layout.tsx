import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Providers from "./providers";
import Header from "@/components/Header";

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
      </head>
      <body className="min-h-screen bg-white dark:bg-[#02050a] text-slate-900 dark:text-slate-100 antialiased transition-colors duration-300">
        <Providers>
          <Suspense fallback={<div className="h-20" />}>
            <Header />
          </Suspense>
          {children}
        </Providers>
      </body>
    </html>
  );
}
