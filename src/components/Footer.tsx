import Link from 'next/link';
import { ArrowUp, Search } from 'lucide-react';
import Logo from './Logo';

const CATEGORIES = [
  { label: '电影', href: '/?cat=1' },
  { label: '连续剧', href: '/?cat=2' },
  { label: '综艺', href: '/?cat=3' },
  { label: '动漫', href: '/?cat=4' },
  { label: '短剧', href: '/?cat=36' },
  { label: '体育', href: '/?cat=48' },
];

const EXPLORE = [
  { label: '首页', href: '/' },
  { label: '搜索', href: '/search' },
  { label: '音乐', href: '/music' },
];

const HOTKEYS: [string, string][] = [
  ['空格', '播放 / 暂停'],
  ['← →', '快退 / 快进'],
  ['↑ ↓', '音量'],
  ['F', '全屏'],
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-card/60 sm:mt-32">
      <div className="wrap">
        {/* 搜索带 */}
        <div className="flex flex-col gap-6 border-b border-line py-10 sm:py-14 lg:flex-row lg:items-end lg:justify-between">
          <p className="text-4xl font-black leading-[1.05] tracking-[-0.05em] text-ink sm:text-5xl">
            今晚, 看点<span className="text-pop">什么</span>?
          </p>
          <form action="/search" role="search" className="relative w-full lg:max-w-md">
            <label htmlFor="footer-search" className="sr-only">
              搜索片名或演员
            </label>
            <input
              id="footer-search"
              name="q"
              type="search"
              placeholder="片名、演员、导演"
              autoComplete="off"
              className="h-14 w-full rounded-full bg-paper pl-6 pr-16 text-base text-ink ring-1 ring-line placeholder:text-sub focus:outline-none focus:ring-2 focus:ring-[var(--pop)]"
            />
            <button
              type="submit"
              aria-label="搜索"
              className="absolute right-1.5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-accent text-onaccent transition-transform hover:scale-105"
            >
              <Search size={19} strokeWidth={2.5} aria-hidden="true" />
            </button>
          </form>
        </div>

        {/* 链接区 */}
        <div className="grid gap-10 py-10 sm:grid-cols-2 sm:py-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="max-w-xs">
            <Link href="/" aria-label="喵喵影视 首页" className="inline-block">
              <Logo />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-sub">
              聚合第三方公开片源, 电影、剧集、综艺、动漫一站搜索, 打开就能看。
            </p>
          </div>

          <FooterNav title="分类" links={CATEGORIES} />
          <FooterNav title="发现" links={EXPLORE} />

          <div>
            <h2 className="text-xs font-bold text-sub">播放器快捷键</h2>
            <dl className="mt-4 space-y-2.5">
              {HOTKEYS.map(([k, v]) => (
                <div key={k} className="flex items-center gap-3 text-sm">
                  <dt>
                    <kbd className="inline-flex h-7 min-w-[3rem] items-center justify-center rounded-lg bg-paper px-2 font-sans text-xs font-bold text-ink ring-1 ring-line">
                      {k}
                    </kbd>
                  </dt>
                  <dd className="font-medium text-ink/80">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* 底栏 */}
        <div className="flex flex-col gap-4 border-t border-line py-6 text-xs text-sub sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[60ch] leading-relaxed">
            © 2026 喵喵影视 · 本站不存储任何视频文件, 资源版权归原权利人所有, 仅供学习交流。
          </p>
          <a
            href="#"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 self-start rounded-full px-4 font-bold text-ink ring-1 ring-line transition-colors hover:bg-ink hover:text-paper sm:self-auto"
          >
            <ArrowUp size={14} strokeWidth={2.5} aria-hidden="true" />
            回到顶部
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterNav({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <nav aria-label={title}>
      <h2 className="text-xs font-bold text-sub">{title}</h2>
      <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-1">
        {links.map(l => (
          <li key={l.href}>
            <Link href={l.href} className="text-[15px] font-bold text-ink transition-colors hover:text-pop">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
