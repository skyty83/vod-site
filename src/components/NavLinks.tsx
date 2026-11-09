'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { getTopCategoryId } from '@/lib/categories';

const ITEMS: { label: string; href: string; cat?: number }[] = [
  { label: '首页', href: '/' },
  { label: '电影', href: '/?cat=1', cat: 1 },
  { label: '连续剧', href: '/?cat=2', cat: 2 },
  { label: '综艺', href: '/?cat=3', cat: 3 },
  { label: '动漫', href: '/?cat=4', cat: 4 },
  { label: '短剧', href: '/?cat=36', cat: 36 },
  { label: '体育', href: '/?cat=48', cat: 48 },
  { label: '音乐', href: '/music' },
];

export default function NavLinks() {
  const pathname = usePathname();
  const catParam = useSearchParams().get('cat');
  const activeCat = catParam ? getTopCategoryId(parseInt(catParam, 10)) : undefined;

  const isActive = (item: (typeof ITEMS)[number]) => {
    if (item.cat !== undefined) return pathname === '/' && activeCat === item.cat;
    if (item.href === '/') return pathname === '/' && activeCat === undefined;
    return pathname.startsWith(item.href);
  };

  return (
    <ul className="flex items-center gap-1 py-2 lg:py-0">
      {ITEMS.map(item => {
        const active = isActive(item);
        return (
          <li key={item.label} className="shrink-0">
            <Link
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`inline-flex h-9 items-center rounded-full px-4 text-[15px] font-bold transition-colors duration-200 ${
                active ? 'bg-accent text-onaccent' : 'text-ink/70 hover:bg-card-2 hover:text-ink'
              }`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
