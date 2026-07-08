"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, LogOut, Sun, Moon, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth/actions";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useRouteLoader } from "@/components/loader/RouteLoader";
import { useFocusTrap } from "@/components/chatbot/useFocusTrap";
import type { NavGroup } from "./DesktopNav";

export function MobileNav({
  open,
  onClose,
  groups,
  activeHref,
  navBadges,
  userEmail,
}: {
  open: boolean;
  onClose: () => void;
  groups: NavGroup[];
  activeHref: string | null;
  navBadges?: Record<string, number>;
  userEmail?: string | null;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();
  const { start } = useRouteLoader();
  const shouldReduceMotion = useReducedMotion();

  useFocusTrap(sheetRef, open, onClose);

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

  useEffect(() => {
    if (open) setExpanded(null);
  }, [open]);

  const handleNavigate = () => {
    start();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            aria-hidden="true"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
          />
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
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
                onClick={onClose}
                aria-label="Close menu"
                className="rounded-lg p-3 text-foreground hover:bg-background"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>

            <nav aria-label="Mobile" className="flex flex-col gap-1">
              {groups.map((group) => {
                if (group.type === "link") {
                  const isActive = group.href === activeHref;
                  return (
                    <Link
                      key={group.label}
                      href={group.href}
                      onClick={handleNavigate}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-3 font-body text-base font-medium transition-colors duration-150",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-background",
                      )}
                    >
                      {group.label}
                      {/* BUGFIX: same gap as DesktopNav — top-level links
                          never rendered navBadges, so Inbox's unread
                          count was computed but never shown. */}
                      {!!navBadges?.[group.href] && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 font-body text-[10px] font-semibold text-primary-foreground">
                          {navBadges[group.href]}
                        </span>
                      )}
                    </Link>
                  );
                }

                const isSectionOpen = expanded === group.label;
                const isGroupActive = group.items.some(
                  (item) => item.href === activeHref,
                );

                return (
                  <div
                    key={group.label}
                    className="border-b border-border/60 pb-1 last:border-none"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded(isSectionOpen ? null : group.label)
                      }
                      aria-expanded={isSectionOpen}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-3 font-body text-xs font-semibold uppercase tracking-wide transition-colors duration-150",
                        isGroupActive ? "text-primary" : "text-secondary-text",
                      )}
                    >
                      {group.label}
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform duration-150",
                          isSectionOpen && "rotate-180",
                        )}
                        strokeWidth={1.75}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isSectionOpen && (
                        <motion.div
                          initial={
                            shouldReduceMotion
                              ? false
                              : { height: 0, opacity: 0 }
                          }
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            duration: shouldReduceMotion ? 0 : 0.18,
                            ease: "easeOut",
                          }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col gap-1 pb-2 pl-2 pt-1">
                            {group.items.map((item) => {
                              const Icon = item.icon;
                              const isActive = item.href === activeHref;
                              return (
                                <Link
                                  key={item.href}
                                  href={item.href}
                                  onClick={handleNavigate}
                                  className={cn(
                                    "flex items-center gap-2.5 rounded-lg px-3 py-2.5 font-body text-sm font-medium transition-colors duration-150",
                                    isActive
                                      ? "bg-primary/10 text-primary"
                                      : "text-foreground hover:bg-background",
                                  )}
                                >
                                  <Icon
                                    className="h-4 w-4 flex-none"
                                    strokeWidth={1.75}
                                  />
                                  <span className="flex flex-1 items-center justify-between">
                                    {item.label}
                                    {!!navBadges?.[item.href] && (
                                      <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 font-body text-[10px] font-semibold text-primary-foreground">
                                        {navBadges[item.href]}
                                      </span>
                                    )}
                                  </span>
                                </Link>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </nav>

            <div className="mt-3 border-t border-border pt-3">
              <Link
                href="/"
                onClick={handleNavigate}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 font-body text-sm font-medium text-secondary-text transition-colors duration-150 hover:bg-background hover:text-foreground"
              >
                <ExternalLink
                  className="h-4 w-4 flex-none"
                  strokeWidth={1.75}
                />
                View live site
              </Link>

              <button
                type="button"
                onClick={toggleTheme}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 font-body text-sm font-medium text-secondary-text transition-colors duration-150 hover:bg-background hover:text-foreground"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 flex-none" strokeWidth={1.75} />
                ) : (
                  <Moon className="h-4 w-4 flex-none" strokeWidth={1.75} />
                )}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>

              {userEmail && (
                <p className="truncate px-3 pb-1 pt-2 font-body text-xs text-secondary-text">
                  {userEmail}
                </p>
              )}

              <form action={signOut} onSubmit={() => start()}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 font-body text-sm font-medium text-secondary-text transition-colors duration-150 hover:bg-background hover:text-foreground"
                >
                  <LogOut className="h-4 w-4 flex-none" strokeWidth={1.75} />
                  Log out
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
