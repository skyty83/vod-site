import { Suspense } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import Logo from './Logo';
import NavLinks from './NavLinks';

export default function Header() {
  return (
    <header className="header-glass sticky top-0 z-40">
      <div className="wrap grid grid-cols-[auto_1fr] items-center gap-x-8 lg:grid-cols-[auto_1fr_auto]">
        <Link href="/" aria-label="喵喵影视 首页" className="row-start-1 flex h-16 items-center">
          <Logo />
        </Link>

        <nav
          aria-label="主导航"
          className="scrollbar-hide col-span-2 row-start-2 -mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:mx-0 lg:px-0"
        >
          <Suspense fallback={<div className="h-[52px] lg:h-16" />}>
            <NavLinks />
          </Suspense>
        </nav>

        <form
          action="/search"
          role="search"
          className="relative col-start-2 row-start-1 min-w-0 justify-self-end lg:col-start-3"
        >
          <label htmlFor="header-search" className="sr-only">
            搜索片名或演员
          </label>
          <Search
            size={17}
            strokeWidth={2.25}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sub"
          />
          <input
            id="header-search"
            name="q"
            type="search"
            placeholder="搜索片名、演员"
            autoComplete="off"
            className="h-10 w-full min-w-0 rounded-full bg-card-2/70 pl-11 pr-4 text-sm text-ink ring-1 ring-line transition-[width,box-shadow] duration-300 ease-out placeholder:text-sub focus:bg-card focus:outline-none focus:ring-2 focus:ring-[var(--pop)] sm:w-56 sm:focus:w-72 lg:w-64 lg:focus:w-80"
          />
          <button type="submit" className="sr-only">
            搜索
          </button>
        </form>
      </div>
    </header>
  );
}
