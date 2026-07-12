"use client";

import { useEffect, useState, useRef, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  LayoutDashboard,
  BookOpen,
  MessagesSquare,
  Users,
  Building2,
  ShieldCheck,
  Sparkles,
  Palette,
  Radio,
  Settings,
  CreditCard,
  KeyRound,
  Webhook,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  ArrowLeft,
  ArrowLeftRight,
  Check,
  Bot,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { signOut, switchActiveOrg } from "@/lib/auth/actions";
import type { OrgMembership } from "@/lib/auth/current-org";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useRouteLoader } from "@/components/loader/RouteLoader";
import { useFocusTrap } from "@/components/chatbot/useFocusTrap";
import { PlatformAmbient } from "@/components/platform/PlatformAmbient";
import { Logo } from "@/components/brand/Logo";

/* ────────────────────────────────────────────────────────────────
   Types
──────────────────────────────────────────────────────────────── */

type SidebarLeaf = { label: string; href: string; icon: LucideIcon };
type SidebarSection = { heading: string; items: SidebarLeaf[] };

export type AgentStatus = "live" | "trial" | "paused";

const COLLAPSE_KEY = "mbr_agent_sidebar_collapsed";

/* ────────────────────────────────────────────────────────────────
   Nav structure — grouped by intent, not by "how it's built".
   A client thinks "I want to change what my agent says" (Train &
   Configure), not "I want to edit guardrails vs templates vs
   appearance as separate unrelated features". Grouping mirrors
   that mental model, same as Chatbase's Sources/Connect grouping.
──────────────────────────────────────────────────────────────── */

function buildSections(isReseller: boolean): SidebarSection[] {
  const sections: SidebarSection[] = [
    {
      heading: "Overview",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      heading: "Engage",
      items: [
        { label: "Inbox", href: "/dashboard/inbox", icon: MessagesSquare },
        { label: "Leads", href: "/dashboard/leads", icon: Users },
        ...(isReseller
          ? [{ label: "Clients", href: "/dashboard/clients", icon: Building2 }]
          : []),
      ],
    },
    {
      heading: "Train & Configure",
      items: [
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
        {
          label: "Templates",
          href: "/dashboard/agent/templates",
          icon: Sparkles,
        },
        { label: "Appearance", href: "/dashboard/appearance", icon: Palette },
        { label: "Channels", href: "/dashboard/channels", icon: Radio },
        {
          label: "Re-run Setup Wizard",
          href: "/dashboard/onboarding",
          icon: RefreshCw,
        },
      ],
    },
    {
      heading: "Account",
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
    },
  ];
  return sections;
}

function flatten(sections: SidebarSection[]): SidebarLeaf[] {
  return sections.flatMap((s) => s.items);
}

/** Same longest-match rule the old top nav used, just applied here. */
function getActiveHref(pathname: string, items: SidebarLeaf[]): string | null {
  let best: string | null = null;
  for (const item of items) {
    const isRoot = item.href === "/dashboard";
    const matches =
      pathname === item.href ||
      (!isRoot && pathname.startsWith(`${item.href}/`));
    if (matches && (best === null || item.href.length > best.length)) {
      best = item.href;
    }
  }
  return best;
}

const STATUS_CONFIG: Record<
  AgentStatus,
  { label: string; dot: string; text: string }
> = {
  live: { label: "Live", dot: "bg-success", text: "text-success" },
  trial: { label: "Trial", dot: "bg-warning", text: "text-warning" },
  paused: {
    label: "Paused",
    dot: "bg-muted-foreground",
    text: "text-secondary-text",
  },
};

/* ────────────────────────────────────────────────────────────────
   Component
──────────────────────────────────────────────────────────────── */

export function AgentSidebarShell({
  agentName,
  agentStatus,
  userEmail,
  isReseller = false,
  navBadges,
  memberships = [],
  activeOrgId = null,
  children,
}: {
  agentName: string;
  agentStatus: AgentStatus;
  userEmail?: string | null;
  isReseller?: boolean;
  navBadges?: Record<string, number>;
  memberships?: OrgMembership[];
  activeOrgId?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { start } = useRouteLoader();
  const shouldReduceMotion = useReducedMotion();
  const [isSwitching, startSwitch] = useTransition();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useFocusTrap(drawerRef, mobileOpen, () => setMobileOpen(false));

  useEffect(() => {
    const stored = window.localStorage.getItem(COLLAPSE_KEY);
    if (stored === "1") setCollapsed(true);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  };

  const sections = buildSections(isReseller);
  const activeHref = getActiveHref(pathname, flatten(sections));
  const status = STATUS_CONFIG[agentStatus];

  const handleNavigate = (href: string) => {
    if (href !== pathname) start();
    setMobileOpen(false);
  };

  /* ── Shared nav list markup (used by both desktop + mobile) ── */
  const renderSections = (opts: { collapsedMode: boolean }) => (
    <nav
      className="flex-1 space-y-6 overflow-y-auto px-3 pb-4"
      aria-label="Agent management"
    >
      {sections.map((section) => (
        <div key={section.heading}>
          {!opts.collapsedMode && (
            <div className="mb-1.5 px-3 font-body text-[10px] font-bold uppercase tracking-wider text-secondary-text/60">
              {section.heading}
            </div>
          )}
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const isActive = item.href === activeHref;
              const badge = navBadges?.[item.href];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => handleNavigate(item.href)}
                  title={opts.collapsedMode ? item.label : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 font-body text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    opts.collapsedMode && "justify-center px-0",
                    isActive
                      ? "bg-primary/12 text-primary font-semibold"
                      : "text-secondary-text hover:bg-foreground/5 hover:text-foreground",
                  )}
                >
                  {isActive && !opts.collapsedMode && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                  )}
                  <item.icon
                    className="h-[18px] w-[18px] flex-shrink-0"
                    strokeWidth={1.8}
                  />
                  {!opts.collapsedMode && (
                    <span className="flex flex-1 items-center justify-between">
                      {item.label}
                      {!!badge && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 font-body text-[10px] font-semibold text-primary-foreground">
                          {badge}
                        </span>
                      )}
                    </span>
                  )}
                  {opts.collapsedMode && !!badge && (
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const AgentIdentity = ({ collapsedMode }: { collapsedMode: boolean }) => (
    <div
      className={cn(
        "mx-3 mb-4 rounded-xl border border-border bg-background/60 p-3",
        collapsedMode && "flex justify-center px-0",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3",
          collapsedMode && "flex-col gap-1.5",
        )}
      >
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-sm">
          <Bot className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </div>
        {!collapsedMode && (
          <div className="min-w-0">
            <div className="truncate font-heading text-sm font-semibold text-foreground">
              {agentName}
            </div>
            <div
              className={cn(
                "flex items-center gap-1.5 font-body text-xs",
                status.text,
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
              {status.label}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const Footer = ({ collapsedMode }: { collapsedMode: boolean }) => (
    <div className="border-t border-border p-3">
      <div
        className={cn("flex items-center gap-2", collapsedMode && "flex-col")}
      >
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={
            theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
          }
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-secondary-text transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" strokeWidth={1.75} />
          ) : (
            <Moon className="h-4 w-4" strokeWidth={1.75} />
          )}
        </button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              aria-label="Account menu"
              className={cn(
                "flex h-9 flex-1 items-center gap-2 rounded-lg px-2 text-left transition-colors hover:bg-foreground/5",
                collapsedMode && "w-9 flex-none justify-center px-0",
              )}
            >
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-body text-xs font-semibold text-primary">
                {userEmail?.[0]?.toUpperCase() ?? "?"}
              </span>
              {!collapsedMode && (
                <span className="truncate font-body text-xs text-secondary-text">
                  {userEmail}
                </span>
              )}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              side="top"
              align="start"
              sideOffset={8}
              className="z-50 w-56 rounded-xl border border-border bg-card p-1.5 shadow-xl shadow-black/[0.06] dark:shadow-black/30"
            >
              {memberships.length > 1 && (
                <>
                  <DropdownMenu.Label className="px-3 pb-1 pt-1.5 font-body text-[11px] font-medium uppercase tracking-wide text-secondary-text/70">
                    Switch organization
                  </DropdownMenu.Label>
                  {memberships.map((m) => (
                    <DropdownMenu.Item
                      key={m.organizationId}
                      disabled={isSwitching || m.organizationId === activeOrgId}
                      onSelect={() => {
                        if (m.organizationId === activeOrgId) return;
                        start();
                        startSwitch(() => {
                          switchActiveOrg(m.organizationId);
                        });
                      }}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 font-body text-sm font-medium text-secondary-text outline-none transition-colors data-[highlighted]:bg-background data-[highlighted]:text-foreground data-[disabled]:cursor-default"
                    >
                      {m.organizationId === activeOrgId ? (
                        <Check
                          className="h-4 w-4 flex-none text-primary"
                          strokeWidth={2}
                        />
                      ) : (
                        <ArrowLeftRight
                          className="h-4 w-4 flex-none"
                          strokeWidth={1.75}
                        />
                      )}
                      <span className="min-w-0 flex-1 truncate">
                        {m.organizationName}
                      </span>
                    </DropdownMenu.Item>
                  ))}
                  <DropdownMenu.Separator className="mx-1 my-1.5 h-px bg-border" />
                </>
              )}

              <DropdownMenu.Item
                onSelect={() => {
                  const form = document.getElementById(
                    "agent-shell-signout-form",
                  ) as HTMLFormElement | null;
                  start();
                  form?.requestSubmit();
                }}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 font-body text-sm font-medium text-secondary-text outline-none transition-colors data-[highlighted]:bg-background data-[highlighted]:text-foreground"
              >
                <LogOut className="h-4 w-4 flex-none" strokeWidth={1.75} />
                Log out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
          <form
            id="agent-shell-signout-form"
            action={signOut}
            className="hidden"
          />
        </DropdownMenu.Root>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-background">
      <PlatformAmbient />

      {/* ═══ DESKTOP SIDEBAR ═══ */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border bg-card/70 backdrop-blur-md transition-[width] duration-200 ease-out md:flex",
          collapsed ? "w-[76px]" : "w-[272px]",
        )}
      >
        <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-border px-4">
          {!collapsed && <Logo markClassName="h-6 w-6" />}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-secondary-text transition-colors hover:bg-foreground/5 hover:text-foreground",
              collapsed && "mx-auto",
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
            ) : (
              <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
            )}
          </button>
        </div>

        <div className="pt-4">
          <AgentIdentity collapsedMode={collapsed} />
        </div>

        {renderSections({ collapsedMode: collapsed })}

        {!collapsed && (
          <Link
            href="/"
            onClick={() => start()}
            className="mx-3 mb-3 flex items-center gap-2 rounded-lg px-3 py-2 font-body text-xs text-secondary-text/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
            Back to website
          </Link>
        )}

        <Footer collapsedMode={collapsed} />
      </aside>

      {/* ═══ MOBILE TOP BAR ═══ */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-md md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground hover:bg-card"
        >
          <Menu className="h-5 w-5" strokeWidth={1.8} />
        </button>
        <div className="flex items-center gap-2 font-heading text-sm font-semibold text-foreground">
          <Bot className="h-4 w-4 text-primary" strokeWidth={1.8} />
          {agentName}
        </div>
        <span
          className={cn("h-2 w-2 rounded-full", status.dot)}
          aria-label={status.label}
        />
      </header>

      {/* ═══ MOBILE DRAWER ═══ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              aria-hidden="true"
              onClick={() => setMobileOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
            />
            <motion.div
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Agent management menu"
              initial={shouldReduceMotion ? false : { x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { type: "spring", damping: 28, stiffness: 320 }
              }
              className="fixed inset-y-0 left-0 z-50 flex w-[85%] max-w-[300px] flex-col border-r border-border bg-card md:hidden"
            >
              <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-border px-4">
                <Logo markClassName="h-6 w-6" />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-secondary-text hover:bg-foreground/5"
                >
                  <X className="h-4.5 w-4.5" strokeWidth={1.8} />
                </button>
              </div>
              <div className="pt-4">
                <AgentIdentity collapsedMode={false} />
              </div>
              {renderSections({ collapsedMode: false })}
              <Link
                href="/"
                onClick={() => {
                  start();
                  setMobileOpen(false);
                }}
                className="mx-3 mb-3 flex items-center gap-2 rounded-lg px-3 py-2 font-body text-xs text-secondary-text/70 hover:bg-foreground/5 hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
                Back to website
              </Link>
              <Footer collapsedMode={false} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══ MAIN CONTENT ═══ */}
      <main
        className={cn(
          "min-w-0 pt-14 transition-[padding-left] duration-200 ease-out md:pt-0",
          collapsed ? "md:pl-[76px]" : "md:pl-[272px]",
        )}
      >
        <div className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
