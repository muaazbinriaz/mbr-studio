"use client";

import Link from "next/link";
import { Sun, Moon, Menu, X } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { navLinks, primaryCta, secondaryCta, siteConfig } from "@/config/site";
import { blogPosts } from "@/data/blog";

import { cn } from "@/lib/utils";

const SCROLL_THRESHOLD = 24;

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Safe check: ensure blogPosts is an array before calling .some()
  const hasPublishedPosts =
    Array.isArray(blogPosts) && blogPosts.some((p) => p.published);
  const visibleNavLinks = navLinks.filter(
    (link) => link.href !== "/blog" || hasPublishedPosts,
  );

  const drawerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    const drawer = drawerRef.current;
    const focusableSelector =
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusables = drawer
      ? Array.from(drawer.querySelectorAll<HTMLElement>(focusableSelector))
      : [];
    focusables[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }

      if (e.key !== "Tab" || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 border-b transition-[background-color,backdrop-filter,border-color] duration-200 ease-out",
          scrolled
            ? "border-border bg-background/85 backdrop-blur-md"
            : "border-transparent bg-transparent backdrop-blur-none",
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="font-heading text-lg font-semibold tracking-tight"
          >
            {siteConfig.name}
          </Link>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-8 md:flex"
          >
            {visibleNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={
                  (
                    (link.href as string) === "/"
                      ? pathname === "/"
                      : pathname.startsWith(link.href)
                  )
                    ? "page"
                    : undefined
                }
                className={cn(
                  "relative text-sm transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:transition-all after:duration-300",
                  (
                    (link.href as string) === "/"
                      ? pathname === "/"
                      : pathname.startsWith(link.href)
                  )
                    ? "text-foreground after:w-full after:bg-foreground"
                    : "text-secondary-text hover:text-foreground after:w-0 hover:after:w-full after:bg-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA + Theme Toggle */}
          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === "dark"
                  ? "Switch to light theme"
                  : "Switch to dark theme"
              }
              className="rounded-lg p-2 text-secondary-text transition-colors hover:bg-card hover:text-foreground"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            <Button asChild variant="outline" size="sm">
              <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={primaryCta.href}>{primaryCta.label}</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            ref={menuButtonRef}
            type="button"
            className="-mr-1 rounded-md p-3 text-foreground md:hidden"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-nav-drawer"
            onClick={() => setOpen(true)}
          >
            <Menu className="size-6" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Mobile backdrop */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/60 transition-opacity duration-200 md:hidden",
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      />

      {/* Mobile drawer */}
      <div
        id="mobile-nav-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-xs flex-col border-l border-border bg-background transition-transform duration-300 ease-out md:hidden",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-6">
          <span className="font-heading text-lg font-semibold tracking-tight">
            {siteConfig.name}
          </span>
          <button
            type="button"
            className="-mr-1 rounded-md p-3 text-foreground"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            <X className="size-6" aria-hidden="true" />
          </button>
        </div>

        <nav
          aria-label="Mobile"
          className="flex flex-1 flex-col gap-1 px-4 pt-2"
        >
          {visibleNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              aria-current={
                (
                  (link.href as string) === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href)
                )
                  ? "page"
                  : undefined
              }
              className={cn(
                "relative text-sm transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:transition-all after:duration-300",
                (
                  (link.href as string) === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href)
                )
                  ? "text-foreground after:w-full after:bg-foreground"
                  : "text-secondary-text hover:text-foreground after:w-0 hover:after:w-full after:bg-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile theme toggle + CTA */}
        <div className="border-t border-border p-4">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              theme === "dark"
                ? "Switch to light theme"
                : "Switch to dark theme"
            }
            className="mb-4 flex w-full items-center gap-2 rounded-lg px-2 py-3 text-secondary-text transition-colors hover:bg-card hover:text-foreground"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>
          <Button asChild variant="outline" size="lg" className="mb-2 w-full">
            <Link href={secondaryCta.href} onClick={() => setOpen(false)}>
              {secondaryCta.label}
            </Link>
          </Button>
          <Button asChild size="lg" className="w-full">
            <Link href={primaryCta.href} onClick={() => setOpen(false)}>
              {primaryCta.label}
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}
