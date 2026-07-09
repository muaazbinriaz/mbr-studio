"use client";

import { motion, type Transition } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CreditCard,
  Settings,
  ShieldCheck,
  Sparkles,
  Palette,
  Radio,
  KeyRound,
  Webhook,
} from "lucide-react";
import { CUSTOM_NAV_ICONS } from "./custom-nav-icons";

// Resend-style icon hover: icons never reposition — each one plays its
// own small, semantically-fitting motion in place, driven by Framer
// Motion spring physics (not CSS transitions) so it has real bounce
// instead of a linear ease. Keyed by the icon component itself so the
// mapping stays correct regardless of array order or which navbar
// renders it.
type IconMotion = {
  rest: Record<string, number>;
  hover: Record<string, number>;
  transition?: Transition;
};

// Bumped stiffness up / damping down vs. a "safe" spring — this is what
// actually reads as playful. A critically-damped spring (damping ~16+)
// just eases in with no character; this overshoots slightly and settles,
// which is what gives Resend's icons their snap.
const SPRING: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 10,
  mass: 0.7,
};
const SOFT_SPRING: Transition = {
  type: "spring",
  stiffness: 220,
  damping: 11,
  mass: 0.8,
};
const GEAR_TURN: Transition = { duration: 0.6, ease: "easeInOut" };

// This map is now only the fallback tier — icons with a hand-built
// custom component in custom-nav-icons.tsx are checked first (see
// NavIcon below) and never reach this map. What's left here is mostly
// dropdown-panel items that don't yet have a bespoke animation.
const ICON_MOTION = new Map<LucideIcon, IconMotion>([
  [
    Building2,
    {
      rest: { y: 0, scale: 1 },
      hover: { y: -3, scale: 1.1 },
      transition: SOFT_SPRING,
    },
  ],
  [
    ShieldCheck,
    {
      rest: { scale: 1, rotate: 0 },
      hover: { scale: 1.25, rotate: -12 },
      transition: SPRING,
    },
  ],
  [
    Sparkles,
    {
      rest: { rotate: 0, scale: 1 },
      hover: { rotate: 180, scale: 1.25 },
      transition: { duration: 0.4, ease: "easeInOut" },
    },
  ],
  [
    Palette,
    {
      rest: { rotate: 0, scale: 1 },
      hover: { rotate: -22, scale: 1.1 },
      transition: SOFT_SPRING,
    },
  ],
  [
    Radio,
    {
      rest: { scale: 1, rotate: 0 },
      hover: { scale: 1.28, rotate: 12 },
      transition: SPRING,
    },
  ],
  [
    KeyRound,
    { rest: { rotate: 0 }, hover: { rotate: -35 }, transition: SOFT_SPRING },
  ],
  [
    Webhook,
    {
      rest: { rotate: 0, scale: 1 },
      hover: { rotate: 22, scale: 1.1 },
      transition: SPRING,
    },
  ],
  [
    Settings,
    { rest: { rotate: 0 }, hover: { rotate: 100 }, transition: GEAR_TURN },
  ],
  [
    CreditCard,
    {
      rest: { rotate: 0, y: 0 },
      hover: { rotate: -12, y: -2 },
      transition: SOFT_SPRING,
    },
  ],
]);

const DEFAULT_ICON_MOTION: IconMotion = {
  rest: { rotate: 0, scale: 1 },
  hover: { rotate: 14, scale: 1.15 },
  transition: SPRING,
};

/**
 * Renders a Lucide icon wrapped in a motion.span whose animation state
 * is externally controlled via `hovered` (set by the parent Link's own
 * onMouseEnter/onMouseLeave), so the whole row — not just the icon's
 * small hitbox — triggers the motion. The icon itself never moves out
 * of its box; only its internal transform (rotate/scale/y) animates.
 */
export function NavIcon({
  icon: Icon,
  hovered,
  className,
  strokeWidth = 1.75,
}: {
  icon: LucideIcon;
  hovered: boolean;
  className?: string;
  strokeWidth?: number;
}) {
  const Custom = CUSTOM_NAV_ICONS.get(Icon);
  if (Custom) {
    return <Custom hovered={hovered} className={className} />;
  }

  const variant = ICON_MOTION.get(Icon) ?? DEFAULT_ICON_MOTION;
  return (
    <motion.span
      className="inline-flex flex-none"
      initial="rest"
      animate={hovered ? "hover" : "rest"}
      variants={{ rest: variant.rest, hover: variant.hover }}
      transition={variant.transition}
    >
      <Icon
        className={className}
        strokeWidth={strokeWidth}
        aria-hidden="true"
      />
    </motion.span>
  );
}
