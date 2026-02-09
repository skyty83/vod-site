'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Header() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 max-w-screen-2xl items-center px-4">
                    <div className="mr-4 flex">
                        <a className="mr-6 flex items-center space-x-2 font-bold" href="/">
                            <Monitor className="h-6 w-6" />
                            <span className="hidden sm:inline-block">VOD Stream</span>
                        </a>
                    </div>
                </div>
            </header>
        )
    }

    return (
        <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center px-4 md:px-8 mx-auto">
                <div className="mr-4 flex">
                    <a className="mr-6 flex items-center space-x-2 font-bold text-gray-900 dark:text-gray-100" href="/">
                        <Monitor className="h-6 w-6" />
                        <span className="hidden sm:inline-block">VOD Stream</span>
                    </a>
                </div>
                <div className="flex flex-1 items-center justify-end space-x-2">
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 h-9 w-9 text-gray-900 dark:text-gray-100"
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? (
                            <Sun className="h-5 w-5" />
                        ) : (
                            <Moon className="h-5 w-5" />
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
}
