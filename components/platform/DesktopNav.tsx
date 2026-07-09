"use client";

import Link from "next/link";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouteLoader } from "@/components/loader/RouteLoader";
import { NavDropdown } from "./NavDropdown";
import { NavIcon } from "@/components/nav/nav-icon-motion";

export type NavLeaf = { label: string; href: string; icon: LucideIcon };
export type NavGroup =
  | { type: "link"; label: string; href: string; icon: LucideIcon }
  | { type: "dropdown"; label: string; icon: LucideIcon; items: NavLeaf[] };

function TopLevelNavLink({
  group,
  isActive,
  navBadges,
  onNavigate,
}: {
  group: Extract<NavGroup, { type: "link" }>;
  isActive: boolean;
  navBadges?: Record<string, number>;
  onNavigate: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={group.href}
      onClick={onNavigate}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "group relative flex items-center gap-1.5 rounded-lg px-3 py-2 font-body text-sm font-medium transition-colors duration-200 after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-[55%] after:-translate-x-1/2 after:rounded-t-sm after:bg-gradient-to-r after:from-transparent after:via-primary after:to-transparent after:transition-transform after:duration-300 after:ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97]",
        isActive
          ? "bg-primary/15 text-primary font-semibold after:scale-x-100"
          : "text-secondary-text after:scale-x-0 hover:bg-foreground/5 hover:font-semibold hover:text-foreground hover:after:scale-x-100",
      )}
    >
      <NavIcon icon={group.icon} hovered={hovered} className="h-4 w-4" />
      {group.label}
      {/* BUGFIX: now correctly renders the badge for top‑level links */}
      {!!navBadges?.[group.href] && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 font-body text-[10px] font-semibold text-primary-foreground">
          {navBadges[group.href]}
        </span>
      )}
    </Link>
  );
}

function DropdownItemLink({
  item,
  isActive,
  navBadges,
  onNavigate,
}: {
  item: NavLeaf;
  isActive: boolean;
  navBadges?: Record<string, number>;
  onNavigate: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={item.href}
      role="menuitem"
      onClick={onNavigate}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg px-3 py-2 font-body text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97]",
        isActive
          ? "bg-primary/15 text-primary font-semibold"
          : "text-foreground hover:bg-foreground/5 hover:font-semibold",
      )}
    >
      <NavIcon icon={item.icon} hovered={hovered} className="h-4 w-4" />
      <span className="flex flex-1 items-center justify-between">
        {item.label}
        {!!navBadges?.[item.href] && (
          <span
            className={cn(
              "ml-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-body text-[10px] font-semibold",
              isActive
                ? "bg-primary-foreground text-primary"
                : "bg-primary text-primary-foreground",
            )}
          >
            {navBadges[item.href]}
          </span>
        )}
      </span>
    </Link>
  );
}

export function DesktopNav({
  groups,
  activeHref,
  navBadges,
}: {
  groups: NavGroup[];
  activeHref: string | null;
  navBadges?: Record<string, number>;
}) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const { start } = useRouteLoader();

  return (
    <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
      {groups.map((group) => {
        if (group.type === "link") {
          const isActive = group.href === activeHref;
          return (
            <TopLevelNavLink
              key={group.label}
              group={group}
              isActive={isActive}
              navBadges={navBadges}
              onNavigate={() => start()}
            />
          );
        }

        const isGroupActive = group.items.some(
          (item) => item.href === activeHref,
        );
        const isOpen = openGroup === group.label;

        return (
          <NavDropdown
            key={group.label}
            label={group.label}
            icon={group.icon}
            isActive={isGroupActive}
            isOpen={isOpen}
            onToggle={() => setOpenGroup(isOpen ? null : group.label)}
            onClose={() => setOpenGroup(null)}
          >
            {group.items.map((item) => (
              <DropdownItemLink
                key={item.href}
                item={item}
                isActive={item.href === activeHref}
                navBadges={navBadges}
                onNavigate={() => {
                  start();
                  setOpenGroup(null);
                }}
              />
            ))}
          </NavDropdown>
        );
      })}
    </nav>
  );
}
