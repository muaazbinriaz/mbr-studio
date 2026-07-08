"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LogOut, Sun, Moon, ExternalLink } from "lucide-react";
import {
  Building2,
  Settings,
  BookOpen,
  MessagesSquare,
  Palette,
  ShieldCheck,
  Sparkles,
  Users,
  KeyRound,
  Webhook,
  CreditCard,
  Radio,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth/actions";
import { useTheme } from "@/components/theme/ThemeProvider";
import { PlatformAmbient } from "@/components/platform/PlatformAmbient";
import { useRouteLoader } from "@/components/loader/RouteLoader";
import { DesktopNav, type NavGroup } from "@/components/platform/DesktopNav";
import { MobileNav } from "@/components/platform/MobileNav";

export type PlatformVariant = "admin" | "client";

const NAV_GROUPS_BY_VARIANT: Record<
  PlatformVariant,
  (isReseller: boolean) => NavGroup[]
> = {
  admin: () => [
    { type: "link", label: "Overview", href: "/admin" },
    { type: "link", label: "Organizations", href: "/admin/organizations" },
    { type: "link", label: "Billing", href: "/admin/billing" },
    { type: "link", label: "Settings", href: "/admin/settings" },
  ],

  client: (isReseller) => {
    // Essential: what a small-business owner touches regularly, always
    // one click away. Everything else lives under two grouped menus —
    // "Agent" (config that shapes what the bot says/does) and "Account"
    // (billing, keys, webhooks) — instead of one flat 9-item dropdown.
    // Nothing is removed, just re-prioritized and grouped by intent.
    const groups: NavGroup[] = [
      { type: "link", label: "Overview", href: "/dashboard" },
      {
        type: "link",
        label: "Knowledge Base",
        href: "/dashboard/knowledge-base",
      },
      { type: "link", label: "Inbox", href: "/dashboard/inbox" },
      { type: "link", label: "Leads", href: "/dashboard/leads" },
    ];

    if (isReseller) {
      groups.push({
        type: "link",
        label: "Clients",
        href: "/dashboard/clients",
      });
    }

    groups.push({
      type: "dropdown",
      label: "Agent",
      items: [
        {
          label: "Guardrails",
          href: "/dashboard/agent/guardrails",
          icon: ShieldCheck,
        },
        {
          label: "Templates",
          href: "/dashboard/agent/templates",
          icon: Sparkles,
        },
        { label: "Appearance", href: "/dashboard/appearance", icon: Palette },
        { label: "Channels", href: "/dashboard/channels", icon: Radio },
        {
          label: "Setup Wizard",
          href: "/dashboard/onboarding",
          icon: Sparkles,
        },
      ],
    });

    groups.push({
      type: "dropdown",
      label: "Account",
      items: [
        { label: "Settings", href: "/dashboard/settings", icon: Settings },
        {
          label: "Billing",
          href: "/dashboard/settings/billing",
          icon: CreditCard,
        },
        {
          label: "API Keys",
          href: "/dashboard/settings/api-keys",
          icon: KeyRound,
        },
        {
          label: "Webhooks",
          href: "/dashboard/settings/webhooks",
          icon: Webhook,
        },
      ],
    });

    return groups;
  },
};

const BRAND_BY_VARIANT: Record<PlatformVariant, string> = {
  admin: "MBR Studio — Admin",
  client: "MBR Studio",
};

function flattenHrefs(groups: NavGroup[]): { href: string }[] {
  return groups.flatMap((group) =>
    group.type === "link"
      ? [{ href: group.href }]
      : group.items.map((item) => ({ href: item.href })),
  );
}

/**
 * Same longest-match logic the old sidebar shell used — carried over
 * unchanged, just applied to the flattened list of every href across
 * all top-level groups and their dropdown items.
 */
function getActiveHref(
  pathname: string,
  hrefs: { href: string }[],
): string | null {
  let best: string | null = null;

  for (const item of hrefs) {
    const isRootRoute = item.href === "/admin" || item.href === "/dashboard";
    const matches =
      pathname === item.href ||
      (!isRootRoute && pathname.startsWith(`${item.href}/`));

    if (matches && (best === null || item.href.length > best.length)) {
      best = item.href;
    }
  }

  return best;
}

export function PlatformShell({
  variant,
  userEmail,
  navBadges,
  isReseller = false,
  children,
}: {
  variant: PlatformVariant;
  userEmail?: string | null;
  /** Keyed by nav item href, e.g. { "/dashboard/inbox": 3 } */
  navBadges?: Record<string, number>;
  isReseller?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { start } = useRouteLoader();

  const groups = NAV_GROUPS_BY_VARIANT[variant](isReseller);
  const brand = BRAND_BY_VARIANT[variant];
  const activeHref = getActiveHref(pathname, flattenHrefs(groups));

  return (
    <div className="relative min-h-screen bg-background">
      <PlatformAmbient />

      <header className="fixed inset-x-0 top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <Link
              href={variant === "admin" ? "/admin" : "/dashboard"}
              onClick={() => start()}
              className="font-heading text-base font-semibold tracking-tight text-foreground"
            >
              {brand}
            </Link>
            <Link
              href="/"
              onClick={() => start()}
              className="hidden items-center gap-1 rounded-full border border-border px-2.5 py-1 font-body text-xs text-secondary-text transition-colors duration-150 hover:border-primary/40 hover:text-foreground sm:inline-flex"
            >
              <ExternalLink className="h-3 w-3" strokeWidth={1.75} />
              View live site
            </Link>
          </div>

          <DesktopNav
            groups={groups}
            activeHref={activeHref}
            navBadges={navBadges}
          />

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === "dark"
                  ? "Switch to light theme"
                  : "Switch to dark theme"
              }
              className="hidden rounded-lg p-2 text-secondary-text transition-colors duration-150 hover:bg-card hover:text-foreground md:inline-flex"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <Moon className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>

            <UserMenu userEmail={userEmail} />

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              className="rounded-lg p-3 text-foreground hover:bg-card md:hidden"
            >
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </header>

      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        groups={groups}
        activeHref={activeHref}
        navBadges={navBadges}
        userEmail={userEmail}
      />

      <main className="min-w-0 pt-16">
        <div className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}

function UserMenu({ userEmail }: { userEmail?: string | null }) {
  const [open, setOpen] = useState(false);
  const { start } = useRouteLoader();

  return (
    <div className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Account menu"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-body text-sm font-semibold text-primary transition-colors duration-150 hover:bg-primary/20"
      >
        {userEmail?.[0]?.toUpperCase() ?? "?"}
      </button>

      {open && (
        <>
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40"
          />
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-card p-1.5 shadow-xl shadow-black/[0.06] dark:shadow-black/30"
          >
            {userEmail && (
              <p className="truncate px-3 py-2 font-body text-xs text-secondary-text">
                {userEmail}
              </p>
            )}
            <Link
              href="/"
              role="menuitem"
              onClick={() => start()}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 font-body text-sm font-medium text-secondary-text transition-colors duration-150 hover:bg-background hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4 flex-none" strokeWidth={1.75} />
              View live site
            </Link>
            <form action={signOut} onSubmit={() => start()}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 font-body text-sm font-medium text-secondary-text transition-colors duration-150 hover:bg-background hover:text-foreground"
              >
                <LogOut className="h-4 w-4 flex-none" strokeWidth={1.75} />
                Log out
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
