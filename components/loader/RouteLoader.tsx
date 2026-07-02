"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";

type LoaderContextType = {
  isLoading: boolean;
  start: () => void;
  stop: () => void;
};

const LoaderContext = createContext<LoaderContextType | null>(null);

export function useRouteLoader() {
  const ctx = useContext(LoaderContext);
  if (!ctx)
    throw new Error("useRouteLoader must be used within RouteLoaderProvider");
  return ctx;
}

export function RouteLoaderProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);

    setIsLoading(true);
    setProgress(12); // instant jump so it feels immediate on click

    // Simulate progress creeping forward while we wait for real navigation
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 88) return prev;
        const increment = prev < 60 ? 8 : 2;
        return Math.min(prev + increment, 88);
      });
    }, 200);
  };

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);
    hideTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      setProgress(0);
    }, 250); // let the bar visibly reach 100% before it disappears
  };

  // Route change completed -> stop the bar
  useEffect(() => {
    stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  // Global click listener: catch clicks on internal links anywhere in the
  // app (nav, buttons wrapped in <Link>, footer links, etc.) and start
  // the bar INSTANTLY, before Next.js even begins the transition.
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      const isExternal =
        anchor.target === "_blank" ||
        href.startsWith("http") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        anchor.hasAttribute("download");

      const isModifiedClick =
        e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;

      const isSamePage = href === pathname;

      if (isExternal || isModifiedClick || isSamePage) return;

      start();
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <LoaderContext.Provider value={{ isLoading, start, stop }}>
      {isLoading && (
        <div
          className="fixed left-0 top-0 z-[100] h-[3px] w-full bg-transparent"
          aria-hidden="true"
        >
          <div
            className="h-full bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] shadow-[0_0_8px_var(--color-primary)] transition-[width] duration-200 ease-out"
            style={{
              width: `${progress}%`,
              animation: "route-loader-shimmer 1.2s linear infinite",
            }}
          />
        </div>
      )}
      <style jsx global>{`
        @keyframes route-loader-shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
      {children}
    </LoaderContext.Provider>
  );
}
