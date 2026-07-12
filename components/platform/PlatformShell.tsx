"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Menu, LogOut, Sun, Moon, ArrowLeft } from "lucide-react";
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
  LayoutDashboard,
  Bot,
  CircleUserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth/actions";
import { useTheme } from "@/components/theme/ThemeProvider";
import { PlatformAmbient } from "@/components/platform/PlatformAmbient";
import { useRouteLoader } from "@/components/loader/RouteLoader";
import { DesktopNav, type NavGroup } from "@/components/platform/DesktopNav";
import { MobileNav } from "@/components/platform/MobileNav";
import { Logo } from "@/components/brand/Logo";
import {
  AgentSidebarShell,
  type AgentStatus,
} from "@/components/platform/AgentSidebarShell";
export type PlatformVariant = "admin" | "client";

const NAV_GROUPS_BY_VARIANT: Record<
  PlatformVariant,
  (isReseller: boolean, setupComplete: boolean) => NavGroup[]
> = {
  admin: () => [
    { type: "link", label: "Overview", href: "/admin", icon: LayoutDashboard },
    {
      type: "link",
      label: "Organizations",
      href: "/admin/organizations",
      icon: Building2,
    },
    {
      type: "link",
      label: "Billing",
      href: "/admin/billing",
      icon: CreditCard,
    },
    {
      type: "link",
      label: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ],

  client: (isReseller, setupComplete) => {
    // Pre-setup: only what's actually usable with zero data. Inbox/Leads/
    // Channels/templates are meaningless before the agent is live, so they
    // don't even appear — not hidden-but-reachable, genuinely absent.
    if (!setupComplete) {
      return [
        {
          type: "link",
          label: "Overview",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          type: "link",
          label: "Setup Wizard",
          href: "/dashboard/onboarding",
          icon: Sparkles,
        },
        {
          type: "link",
          label: "Knowledge Base",
          href: "/dashboard/knowledge-base",
          icon: BookOpen,
        },
        {
          type: "link",
          label: "Settings",
          href: "/dashboard/settings",
          icon: Settings,
        },
      ];
    }

    // Essential: what a small-business owner touches regularly, always
    // one click away. Everything else lives under two grouped menus —
    // "Agent" (config that shapes what the bot says/does) and "Account"
    // (billing, keys, webhooks) — instead of one flat 9-item dropdown.
    // Nothing is removed, just re-prioritized and grouped by intent.
    const groups: NavGroup[] = [
      {
        type: "link",
        label: "Overview",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        type: "link",
        label: "Knowledge Base",
        href: "/dashboard/knowledge-base",
        icon: BookOpen,
      },
      {
        type: "link",
        label: "Inbox",
        href: "/dashboard/inbox",
        icon: MessagesSquare,
      },
      { type: "link", label: "Leads", href: "/dashboard/leads", icon: Users },
    ];

    if (isReseller) {
      groups.push({
        type: "link",
        label: "Clients",
        href: "/dashboard/clients",
        icon: Building2,
      });
    }

    groups.push({
      type: "dropdown",
      label: "Agent",
      icon: Bot,
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
      icon: CircleUserRound,
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

const BRAND_SUFFIX_BY_VARIANT: Record<PlatformVariant, string> = {
  admin: "— Admin",
  client: "",
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
  setupComplete = true,
  agentName,
  agentStatus,
  children,
}: {
  variant: PlatformVariant;
  userEmail?: string | null;
  /** Keyed by nav item href, e.g. { "/dashboard/inbox": 3 } */
  navBadges?: Record<string, number>;
  isReseller?: boolean;
  /** Client variant only — false collapses the sidebar to setup-only items. */
  setupComplete?: boolean;
  /** Client variant + setupComplete only — used by the agent sidebar shell. */
  agentName?: string;
  agentStatus?: AgentStatus;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { start } = useRouteLoader();

  // Once the agent is live, the client dashboard IS the agent's
  // management console — no separate "Manage" click needed. Pre-setup
  // (still in the wizard) and the admin variant keep the lighter
  // top-nav shell below, unchanged.
  if (variant === "client" && setupComplete) {
    return (
      <AgentSidebarShell
        agentName={agentName ?? "Your Agent"}
        agentStatus={agentStatus ?? "live"}
        userEmail={userEmail}
        isReseller={isReseller}
        navBadges={navBadges}
      >
        {children}
      </AgentSidebarShell>
    );
  }

  const groups = NAV_GROUPS_BY_VARIANT[variant](isReseller, setupComplete);
  const brandSuffix = BRAND_SUFFIX_BY_VARIANT[variant];
  const activeHref = getActiveHref(pathname, flattenHrefs(groups));

  return (
    <div className="relative min-h-screen bg-background">
      <PlatformAmbient />

      <header className="fixed inset-x-0 top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <Link
              href={variant === "admin" ? "/admin" : "/dashboard"}
              onClick={() => {
                if (
                  pathname !== (variant === "admin" ? "/admin" : "/dashboard")
                )
                  start();
              }}
              className="flex items-center gap-2 font-heading text-base font-semibold tracking-tight text-foreground"
            >
              <Logo markClassName="h-6 w-6" />
              {brandSuffix && (
                <span className="font-body text-sm font-normal text-secondary-text">
                  {brandSuffix}
                </span>
              )}
            </Link>
            <Link
              href="/"
              onClick={() => start()}
              className="group hidden items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-body text-xs text-secondary-text transition-all duration-150 hover:border-primary/30 hover:bg-card hover:text-foreground sm:inline-flex"
            >
              <ArrowLeft
                className="h-3 w-3 transition-transform duration-150 group-hover:-translate-x-0.5"
                strokeWidth={1.75}
              />
              Back to website
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
  const { start } = useRouteLoader();
  const signOutFormRef = useRef<HTMLFormElement>(null);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="hidden h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-body text-sm font-semibold text-primary transition-colors duration-150 hover:bg-primary/20 data-[state=open]:bg-primary/20 md:flex"
        >
          {userEmail?.[0]?.toUpperCase() ?? "?"}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-56 rounded-xl border border-border bg-card p-1.5 shadow-xl shadow-black/[0.06] dark:shadow-black/30"
        >
          {userEmail && (
            <>
              <DropdownMenu.Label className="truncate px-3 pb-2 pt-1.5 font-body text-xs text-secondary-text">
                {userEmail}
              </DropdownMenu.Label>
              <DropdownMenu.Separator className="mx-1 mb-1.5 h-px bg-border" />
            </>
          )}

          <DropdownMenu.Item
            onSelect={() => {
              start();
              signOutFormRef.current?.requestSubmit();
            }}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 font-body text-sm font-medium text-secondary-text outline-none transition-colors duration-150 data-[highlighted]:bg-background data-[highlighted]:text-foreground"
          >
            <LogOut className="h-4 w-4 flex-none" strokeWidth={1.75} />
            Log out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>

      {/* Real submit target for the server action — kept off-screen and
          triggered via requestSubmit() so the visible row can be a
          proper Radix Item (correct role, keyboard nav, Escape/outside
          click handling) instead of a <form> standing in for one. */}
      <form ref={signOutFormRef} action={signOut} className="hidden" />
    </DropdownMenu.Root>
  );
}
