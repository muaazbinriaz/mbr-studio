"use client";

import Link from "next/link";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouteLoader } from "@/components/loader/RouteLoader";
import { NavDropdown } from "./NavDropdown";

export type NavLeaf = { label: string; href: string; icon: LucideIcon };
export type NavGroup =
  | { type: "link"; label: string; href: string }
  | { type: "dropdown"; label: string; items: NavLeaf[] };

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
            <Link
              key={group.label}
              href={group.href}
              onClick={() => start()}
              className={cn(
                "rounded-lg px-3 py-2 font-body text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-secondary-text hover:bg-card hover:text-foreground",
              )}
            >
              {group.label}
            </Link>
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
            isActive={isGroupActive}
            isOpen={isOpen}
            onToggle={() => setOpenGroup(isOpen ? null : group.label)}
            onClose={() => setOpenGroup(null)}
          >
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === activeHref;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  onClick={() => {
                    start();
                    setOpenGroup(null);
                  }}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 font-body text-sm font-medium transition-colors duration-150",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-background",
                  )}
                >
                  <Icon className="h-4 w-4 flex-none" strokeWidth={1.75} />
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
          </NavDropdown>
        );
      })}
    </nav>
  );
}
