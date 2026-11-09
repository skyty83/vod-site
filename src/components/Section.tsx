import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

interface SectionHeadProps {
  title: string;
  /** 可选的拉丁字标, 与中文标题同一行, 全站最多用在两处 */
  kicker?: string;
  href?: string;
}

export function SectionHead({ title, kicker, href }: SectionHeadProps) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4">
      <h2 className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-4xl font-black leading-none tracking-[-0.045em] text-ink sm:text-6xl">
        {kicker && <span className="font-wide text-[0.6em] font-extrabold text-pop">{kicker}</span>}
        <span>{title}</span>
      </h2>
      {href && <AllLink href={href} />}
    </div>
  );
}

export function AllLink({ href, label = '全部' }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex h-10 shrink-0 items-center gap-2 rounded-full pl-4 pr-1.5 text-sm font-bold text-ink ring-1 ring-line transition-colors duration-200 hover:bg-ink hover:text-paper"
    >
      {label}
      <span className="grid size-7 place-items-center rounded-full bg-accent text-onaccent transition-transform duration-300 group-hover:rotate-45">
        <ArrowUpRight size={15} strokeWidth={2.5} aria-hidden="true" />
      </span>
    </Link>
  );
}

export function Row({ children }: { children: React.ReactNode }) {
  return (
    <ul className="shelf-scroll -mx-4 flex snap-x snap-mandatory scroll-px-4 sm:scroll-px-6 lg:scroll-px-10 gap-4 overflow-x-auto px-4 pb-6 pt-2 sm:-mx-6 sm:gap-5 sm:px-6 lg:-mx-10 lg:px-10">
      {children}
    </ul>
  );
}
