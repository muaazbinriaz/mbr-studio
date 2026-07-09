"use client";

import Link from "next/link";
import { Sun, Moon, Menu, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTheme } from "@/components/theme/ThemeProvider";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { navLinks, primaryCta, secondaryCta, siteConfig } from "@/config/site";
import { blogPosts } from "@/data/blog";
import { useFocusTrap } from "@/components/chatbot/useFocusTrap";
import { useChatPanel } from "@/components/chatbot/useChat";
import { NavIcon } from "@/components/nav/nav-icon-motion";

import { cn } from "@/lib/utils";

const SCROLL_THRESHOLD = 24;

function MarketingNavLink({
  link,
  isActive,
  onNavigate,
}: {
  link: (typeof navLinks)[number];
  isActive: boolean;
  onNavigate?: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-[55%] after:-translate-x-1/2 after:rounded-t-sm after:bg-gradient-to-r after:from-transparent after:via-primary after:to-transparent after:transition-transform after:duration-300 after:ease-out",
        isActive
          ? "bg-primary/15 text-primary font-semibold after:scale-x-100"
          : "text-secondary-text after:scale-x-0 hover:bg-foreground/5 hover:font-semibold hover:text-foreground hover:after:scale-x-100",
      )}
    >
      <NavIcon icon={link.icon} hovered={hovered} className="h-4 w-4" />
      {link.label}
    </Link>
  );
}

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

  const shouldReduceMotion = useReducedMotion();
  const { setLauncherSuppressed } = useChatPanel();

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

  // Same focus-trap primitive MobileNav.tsx uses, instead of a
  // hand-rolled keydown/Tab-cycling effect duplicated here.
  useFocusTrap(drawerRef, open, () => setOpen(false));

  useEffect(() => {
    if (!open) return;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [open]);

  // BUGFIX: the floating chat launcher (ChatWindow.tsx) is a fixed,
  // z-50 element rendered independently of this drawer, so it used to
  // float on top of the open mobile nav sheet. Suppress it for as long
  // as this drawer is open.
  useEffect(() => {
    setLauncherSuppressed(open);
    return () => setLauncherSuppressed(false);
  }, [open, setLauncherSuppressed]);

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
          <Link href="/" aria-label={`${siteConfig.name} — Home`}>
            <Logo />
          </Link>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 md:flex"
          >
            {visibleNavLinks.map((link) => {
              const isActive =
                (link.href as string) === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <MarketingNavLink
                  key={link.href}
                  link={link}
                  isActive={isActive}
                />
              );
            })}
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

      {/* Mobile nav — bottom sheet, same pattern as platform MobileNav.tsx */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              aria-hidden="true"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
            />
            <motion.div
              id="mobile-nav-drawer"
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              initial={shouldReduceMotion ? false : { y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { type: "spring", damping: 28, stiffness: 320 }
              }
              className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border bg-card px-4 pb-6 pt-3 md:hidden"
            >
              <div
                className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border"
                aria-hidden="true"
              />
              <div className="mb-2 flex items-center justify-between">
                <span className="font-heading text-sm font-semibold text-foreground">
                  Menu
                </span>
                <button
                  type="button"
                  className="rounded-lg p-3 text-foreground hover:bg-background"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                >
                  <X
                    className="h-5 w-5"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </button>
              </div>

              <nav aria-label="Mobile" className="flex flex-col gap-1">
                {visibleNavLinks.map((link) => {
                  const isActive =
                    (link.href as string) === "/"
                      ? pathname === "/"
                      : pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-3 font-body text-base font-medium transition-colors duration-150",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-background",
                      )}
                    >
                      <link.icon
                        className="h-4 w-4 flex-none transition-transform duration-500 ease-out group-hover:-translate-y-0.5 group-active:-translate-y-0.5"
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-3 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label={
                    theme === "dark"
                      ? "Switch to light theme"
                      : "Switch to dark theme"
                  }
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 font-body text-sm font-medium text-secondary-text transition-colors duration-150 hover:bg-background hover:text-foreground"
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4 flex-none" strokeWidth={1.75} />
                  ) : (
                    <Moon className="h-4 w-4 flex-none" strokeWidth={1.75} />
                  )}
                  {theme === "dark" ? "Light mode" : "Dark mode"}
                </button>

                <div className="mt-2 flex flex-col gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="w-full"
                  >
                    <Link
                      href={secondaryCta.href}
                      onClick={() => setOpen(false)}
                    >
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
