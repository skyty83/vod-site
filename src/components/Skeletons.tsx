// 骨架屏与真实布局同形, 静态呈现, 不做闪烁动画
function PosterSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <div className="aspect-[2/3] rounded-card bg-card-2" />
      <div className="space-y-2 px-0.5 pt-3">
        <div className="h-3.5 w-4/5 rounded-full bg-card-2" />
        <div className="h-3 w-1/2 rounded-full bg-card" />
      </div>
    </div>
  );
}

function HeadSkeleton({ title }: { title?: string }) {
  return (
    <div className="mb-7 flex h-14 items-end">
      {title ? (
        <h2 className="text-4xl font-black leading-none tracking-[-0.045em] text-ink/20 sm:text-6xl">{title}</h2>
      ) : (
        <div className="h-12 w-48 rounded-full bg-card-2" />
      )}
    </div>
  );
}

export function ShelfSkeleton({ title }: { title?: string }) {
  return (
    <section aria-busy="true">
      <HeadSkeleton title={title} />
      <div className="flex gap-5 overflow-hidden pb-6 pt-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <PosterSkeleton key={i} className="w-[150px] shrink-0 sm:w-[180px]" />
        ))}
      </div>
    </section>
  );
}

export function GridSkeleton({ count = 18 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <PosterSkeleton key={i} />
      ))}
    </div>
  );
}

export function TickerSkeleton() {
  return (
    <div className="py-10" aria-hidden="true">
      <div className="-mx-[5%] h-16 -rotate-[1.8deg] bg-accent/40 sm:h-[76px]" />
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="wrap grid min-h-[min(680px,calc(100svh-var(--header-h)-8rem))] items-center gap-10 pb-16 pt-8 lg:grid-cols-12" aria-busy="true">
      <div className="order-2 space-y-5 lg:order-1 lg:col-span-7">
        <div className="h-3 w-28 rounded-full bg-card-2" />
        <div className="h-24 w-4/5 rounded-[20px] bg-card-2 sm:h-36" />
        <div className="h-4 w-1/2 rounded-full bg-card-2" />
        <div className="h-14 w-44 rounded-full bg-card-2" />
      </div>
      <div className="order-1 mx-auto aspect-[2/3] w-[min(52vw,230px)] rounded-panel bg-card-2 sm:w-[270px] lg:order-2 lg:col-span-5 lg:w-[360px]" />
    </div>
  );
}

export function MosaicSkeleton({ title }: { title: string }) {
  return (
    <section aria-busy="true">
      <HeadSkeleton title={title} />
      <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4 lg:grid-cols-6">
        <div className="col-span-2 aspect-[4/3] rounded-panel bg-card-2 md:row-span-2 md:aspect-auto" />
        {Array.from({ length: 8 }).map((_, i) => (
          <PosterSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}
