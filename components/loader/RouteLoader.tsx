"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  Suspense,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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

// Drop-in replacement for next/navigation's useRouter for any component
// that navigates programmatically (auth redirects, wizard "finish" steps,
// redirects after a mutation, etc). It starts the same top progress bar
// that <a> clicks already trigger, so router.push/replace never causes a
// silent/blank wait again. Usage:
//
//   const router = useLoaderRouter();
//   router.push("/dashboard"); // bar starts immediately, same as a link click
export function useLoaderRouter() {
  const router = useRouter();
  const { start } = useRouteLoader();

  return {
    ...router,
    push: (href: string, options?: Parameters<typeof router.push>[1]) => {
      start();
      router.push(href, options);
    },
    replace: (href: string, options?: Parameters<typeof router.replace>[1]) => {
      start();
      router.replace(href, options);
    },
  };
}

// useSearchParams() must live inside its own Suspense boundary — but
// ONLY around this tiny inner component, never around the whole app.
// The old code wrapped `{children}` (the entire app) in a top-level
// <Suspense fallback={null}>, which meant that any state update
// touching this boundary could cause the ENTIRE app tree — including
// whatever <a> a user had just clicked — to briefly unmount and get
// replaced with `null`. That's the confirmed root cause of the
// signup/login logo link silently doing nothing (Prompt 15).
function RouteLoaderInner({
  onRouteChange,
  onClickSetup,
}: {
  onRouteChange: (pathname: string, searchParams: URLSearchParams) => void;
  onClickSetup: (pathname: string) => () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    onRouteChange(pathname, searchParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  useEffect(() => {
    return onClickSetup(pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}

export function RouteLoaderProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);

    setIsLoading(true);
    setProgress(12); // instant jump so it feels immediate on click

    // Safety net: if stop() is never called (same-page click, edge case
    // we haven't anticipated, etc.), force-hide after 4s so the bar can
    // never get permanently stuck again.
    hideTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      setProgress(0);
    }, 4000);

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

  const handleRouteChange = () => {
    stop();
  };

  // Global click listener: catch clicks on internal links anywhere in the
  // app (nav, buttons wrapped in <Link>, footer links, etc.) and start
  // the bar INSTANTLY, before Next.js even begins the transition.
  const setupClickListener = (pathname: string) => {
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
  };

  return (
    <LoaderContext.Provider value={{ isLoading, start, stop }}>
      <Suspense fallback={null}>
        <RouteLoaderInner
          onRouteChange={handleRouteChange}
          onClickSetup={setupClickListener}
        />
      </Suspense>
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
