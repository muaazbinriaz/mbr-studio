"use client";

import { useEffect, useRef, useState } from "react";
import { Radio } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Building2,
  Settings,
  BookOpen,
  MessagesSquare,
  Palette,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth/actions";
import { useTheme } from "@/components/theme/ThemeProvider";
import { PlatformAmbient } from "@/components/platform/PlatformAmbient";
import { useRouteLoader } from "@/components/loader/RouteLoader";
import { useFocusTrap } from "@/components/chatbot/useFocusTrap";

export type PlatformVariant = "admin" | "client";

const SIDEBAR_COLLAPSED_KEY = "mbr-platform-sidebar-collapsed";

/**
 * Nav items (including icon COMPONENTS) live here, inside the client
 * component, on purpose. lucide-react icons are function components —
 * passing them as props from a Server Component layout to this client
 * component would cross the RSC serialization boundary with a
 * non-serializable value ("Functions cannot be passed to Client
 * Components"). Only the plain string `variant` prop crosses that
 * boundary; everything icon-related is resolved locally from it.
 */
const NAV_ITEMS_BY_VARIANT: Record<
  PlatformVariant,
  { label: string; href: string; icon: typeof LayoutDashboard }[]
> = {
  admin: [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Organizations", href: "/admin/organizations", icon: Building2 },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ],

  client: [
    { label: "Get Started", href: "/dashboard/onboarding", icon: Sparkles },
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },

    {
      label: "Knowledge Base",
      href: "/dashboard/knowledge-base",
      icon: BookOpen,
    },
    {
      label: "Guardrails",
      href: "/dashboard/agent/guardrails",
      icon: ShieldCheck,
    },
    { label: "Templates", href: "/dashboard/agent/templates", icon: Sparkles },
    { label: "Leads", href: "/dashboard/leads", icon: Users },
    { label: "Channels", href: "/dashboard/channels", icon: Radio },
    {
      label: "Conversations",
      href: "/dashboard/conversations",
      icon: MessagesSquare,
    },
    { label: "Appearance", href: "/dashboard/appearance", icon: Palette },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ],
};

const BRAND_BY_VARIANT: Record<PlatformVariant, string> = {
  admin: "MBR Studio — Admin",
  client: "MBR Studio",
};

export function PlatformShell({
  variant,
  userEmail,
  children,
}: {
  variant: PlatformVariant;
  userEmail?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileDrawerRef = useRef<HTMLElement | null>(null);

  // Traps Tab focus inside the drawer and closes it on Escape — same
  // hook the marketing site's chat widget already uses, reused here
  // instead of writing a second focus-trap implementation.
  useFocusTrap(mobileDrawerRef, mobileOpen, () => setMobileOpen(false));

  // Locks background scroll while the drawer is open, and compensates
  // for the scrollbar disappearing so the page doesn't visibly shift
  // width when the lock engages/releases.
  useEffect(() => {
    if (!mobileOpen) return;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [mobileOpen]);

  // Desktop icon-only collapse. Read from localStorage after mount only
  // (not during the initial render) so server and client markup match
  // on first paint — flipping to the stored value in a layout effect
  // avoids a hydration mismatch warning.
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === "1") setCollapsed(true);
    setHydrated(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      return next;
    });
  };

  const navItems = NAV_ITEMS_BY_VARIANT[variant];
  const brand = BRAND_BY_VARIANT[variant];

  return (
    <div className="relative flex min-h-screen bg-background">
      <PlatformAmbient />

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden flex-none border-r border-border bg-card md:flex md:flex-col",
          // No transition before hydration — prevents a visible width
          // animation on first load if the stored preference was "collapsed".
          hydrated && "transition-[width] duration-200 ease-out",
          collapsed ? "md:w-[76px]" : "md:w-64",
        )}
      >
        <SidebarContent
          brand={brand}
          navItems={navItems}
          pathname={pathname}
          userEmail={userEmail}
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
        />
      </aside>

      {/* Mobile topbar */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-sm md:hidden">
        <span className="font-heading text-sm font-semibold text-foreground">
          {brand}
        </span>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-2 text-foreground hover:bg-card"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>

      {/* Mobile backdrop */}
      <div
        aria-hidden="true"
        onClick={() => setMobileOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/60 transition-opacity duration-200 md:hidden",
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      />

      {/* Mobile drawer — always full sidebar (never icon-only), per
          the reasoning that collapse is a desktop-density feature; a
          drawer that's already an overlay doesn't need to save width. */}
      <aside
        ref={mobileDrawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Sidebar navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-300 ease-out md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-end px-4">
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="rounded-lg p-2 text-foreground hover:bg-background"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
        <SidebarContent
          brand={brand}
          navItems={navItems}
          pathname={pathname}
          userEmail={userEmail}
          onNavigate={() => setMobileOpen(false)}
          hideHeader
          collapsed={false}
        />
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1 pt-14 md:pt-0">
        <div className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}

function SidebarContent({
  brand,
  navItems,
  pathname,
  userEmail,
  onNavigate,
  hideHeader,
  collapsed,
  onToggleCollapsed,
}: {
  brand: string;
  navItems: { label: string; href: string; icon: typeof LayoutDashboard }[];
  pathname: string;
  userEmail?: string | null;
  onNavigate?: () => void;
  hideHeader?: boolean;
  collapsed: boolean;
  onToggleCollapsed?: () => void;
}) {
  const { theme, toggleTheme } = useTheme();
  const { start } = useRouteLoader();

  return (
    <>
      {!hideHeader && (
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!collapsed && (
            <span className="truncate font-heading text-base font-semibold tracking-tight text-foreground">
              {brand}
            </span>
          )}
          {onToggleCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={cn(
                "flex h-8 w-8 flex-none items-center justify-center rounded-lg text-secondary-text transition-colors duration-150 hover:bg-background hover:text-foreground",
                collapsed && "mx-auto",
              )}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <PanelLeftClose className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>
          )}
        </div>
      )}

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" &&
              item.href !== "/dashboard" &&
              pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                start();
                onNavigate?.();
              }}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 font-body text-sm font-medium transition-colors duration-150",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-secondary-text hover:bg-background hover:text-foreground",
              )}
            >
              {/* Active accent bar — mirrors the red rule pattern from
                  the reference dashboard, using the brand primary color. */}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary transition-opacity duration-150",
                  isActive ? "opacity-100" : "opacity-0",
                )}
              />
              <Icon className="h-4 w-4 flex-none" strokeWidth={1.75} />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          title={
            theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
          }
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-body text-sm font-medium text-secondary-text transition-colors duration-150 hover:bg-background hover:text-foreground",
            collapsed && "justify-center px-0",
          )}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 flex-none" strokeWidth={1.75} />
          ) : (
            <Moon className="h-4 w-4 flex-none" strokeWidth={1.75} />
          )}
          {!collapsed && (theme === "dark" ? "Light mode" : "Dark mode")}
        </button>

        {!collapsed && userEmail && (
          <p className="truncate px-3 pb-1 pt-2 font-body text-xs text-secondary-text">
            {userEmail}
          </p>
        )}

        <form action={signOut} onSubmit={() => start()}>
          <button
            type="submit"
            title={collapsed ? "Log out" : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-body text-sm font-medium text-secondary-text transition-colors duration-150 hover:bg-background hover:text-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            <LogOut className="h-4 w-4 flex-none" strokeWidth={1.75} />
            {!collapsed && "Log out"}
          </button>
        </form>
      </div>
    </>
  );
}
