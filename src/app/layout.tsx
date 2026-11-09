import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Geist, Noto_Sans_SC, Unbounded } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// 拉丁字母与数字用 Geist, 汉字回退到 Noto Sans SC
const latin = Geist({ subsets: ['latin'], display: 'swap', variable: '--font-latin' });

// 装饰性拉丁大字 (TOP 10 序号、分类英文字标)
const wide = Unbounded({ subsets: ['latin'], weight: ['600', '800'], display: 'swap', variable: '--font-wide' });

const body = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  display: 'swap',
  variable: '--font-body',
  preload: false,
});

export const metadata: Metadata = {
  title: { default: '喵喵影视 - 在线视频', template: '%s - 喵喵影视' },
  description: '在线观看最新电影、电视剧、综艺、动漫、体育赛事',
  keywords: '在线视频,电影,电视剧,综艺,动漫,篮球,足球,免费观看',
  // 片源站图床大多校验 Referer, 全站不发送 Referer (也覆盖 CSS 背景图)
  referrer: 'no-referrer',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f6f3' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0c' },
  ],
};

// 部分浏览器扩展(如 Bitdefender)会给每个元素加上 bis_skin_checked 属性,
// 导致 React 水合时报属性不一致。在水合之前把它清掉, 并持续监听后续注入。
const STRIP_EXTENSION_ATTRS = `(function(){var a='bis_skin_checked';function s(r){var n=r.querySelectorAll('['+a+']');for(var i=0;i<n.length;i++)n[i].removeAttribute(a)}s(document);new MutationObserver(function(m){for(var i=0;i<m.length;i++){var t=m[i].target;if(t.removeAttribute)t.removeAttribute(a)}}).observe(document.documentElement,{attributes:true,subtree:true,attributeFilter:[a]})})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${latin.variable} ${body.variable} ${wide.variable}`} suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col" suppressHydrationWarning>
        <Script id="strip-extension-attrs" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: STRIP_EXTENSION_ATTRS }} />
        <Header />
        <main className="flex-1 overflow-x-clip">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
