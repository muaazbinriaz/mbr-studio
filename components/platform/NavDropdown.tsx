"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/components/chatbot/useFocusTrap";
import { NavIcon } from "@/components/nav/nav-icon-motion";

export function NavDropdown({
  label,
  icon,
  isActive,
  isOpen,
  onToggle,
  onClose,
  children,
}: {
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  useFocusTrap(panelRef, isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [isOpen, onClose]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={onToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={cn(
          "group relative flex items-center gap-1.5 rounded-lg px-3 py-2 font-body text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-[55%] after:-translate-x-1/2 after:rounded-t-sm after:bg-gradient-to-r after:from-transparent after:via-primary after:to-transparent after:transition-transform after:duration-300 after:ease-out",
          isActive
            ? "bg-primary/15 text-primary font-semibold after:scale-x-100"
            : "text-secondary-text after:scale-x-0 hover:bg-foreground/5 hover:font-semibold hover:text-foreground hover:after:scale-x-100",
        )}
      >
        <NavIcon icon={icon} hovered={hovered} className="h-4 w-4" />
        {label}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-150",
            isOpen && "rotate-180",
          )}
          strokeWidth={1.75}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            role="menu"
            aria-label={label}
            initial={shouldReduceMotion ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.18, ease: "easeOut" }
            }
            className="absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-card p-1.5 shadow-xl shadow-black/[0.06] dark:shadow-black/30"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
