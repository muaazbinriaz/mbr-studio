"use client";

import { motion, type Transition } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  BookOpen,
  MessagesSquare,
  Users,
  Layers,
  Bot,
  Briefcase,
  Newspaper,
  Mail,
  CircleUserRound,
  Building2,
  ShieldCheck,
  Sparkles,
  Palette,
  Radio,
  KeyRound,
  Webhook,
  CreditCard,
  Settings,
} from "lucide-react";

type CustomIconProps = { hovered: boolean; className?: string };

const SVG_BASE = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
};

const SLOW = { duration: 0.55, ease: "easeInOut" as const };
const GEAR_TURN = { duration: 0.55, ease: "easeInOut" as const };

// Snappy, overshoot-then-settle spring — used for the "featured" part of
// each icon (the bit that should feel confident and alive: a check
// drawing in, a key turning, a chip lighting up). Matches the physics
// philosophy already established in nav-icon-motion.tsx: a critically
// damped spring just eases in with no character; low damping + higher
// stiffness overshoots slightly and settles, which is what reads as
// "Resend snap" rather than a generic hover fade.
const SNAP: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 11,
  mass: 0.6,
};

// Calmer spring for secondary/structural motion (a card tilting, a
// handle lifting) where a big overshoot would look sloppy rather than
// playful.
const SOFT_SPRING: Transition = {
  type: "spring",
  stiffness: 220,
  damping: 13,
  mass: 0.8,
};

// ---------------------------------------------------------------------
// Existing dropdown-panel icons (unchanged)
// ---------------------------------------------------------------------

function DashboardIcon({ hovered, className }: CustomIconProps) {
  const tiles = [
    { x: 3, y: 3 },
    { x: 13, y: 3 },
    { x: 3, y: 13 },
    { x: 13, y: 13 },
  ];
  return (
    <svg {...SVG_BASE} className={className}>
      {tiles.map((t, i) => (
        <motion.rect
          key={i}
          x={t.x}
          y={t.y}
          width={8}
          height={8}
          rx={1.5}
          initial="rest"
          animate={hovered ? "hover" : "rest"}
          variants={{ rest: { scale: 1 }, hover: { scale: 1.14 } }}
          transition={{ ...SLOW, delay: hovered ? i * 0.07 : 0 }}
          style={{ originX: 0.5, originY: 0.5 }}
        />
      ))}
    </svg>
  );
}

function KnowledgeBaseIcon({ hovered, className }: CustomIconProps) {
  return (
    <svg {...SVG_BASE} className={className}>
      <path d="M4 5.5c1.8-1 4-1 6 0v13c-2-1-4.2-1-6 0z" />
      <motion.path
        d="M20 5.5c-1.8-1-4-1-6 0v13c2-1 4.2-1 6 0z"
        initial="rest"
        animate={hovered ? "hover" : "rest"}
        variants={{
          rest: { scaleX: 1, rotate: 0 },
          hover: { scaleX: 0.8, rotate: -5 },
        }}
        transition={SLOW}
        style={{ originX: 0, originY: 0.5 }}
      />
    </svg>
  );
}

function InboxIcon({ hovered, className }: CustomIconProps) {
  const dots = [7.5, 12, 16.5];
  return (
    <svg {...SVG_BASE} className={className}>
      <path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
      {dots.map((cx, i) => (
        <motion.circle
          key={cx}
          cx={cx}
          cy={10.5}
          r={1}
          fill="currentColor"
          stroke="none"
          initial="rest"
          animate={hovered ? "hover" : "rest"}
          variants={{
            rest: { y: 0, opacity: 0.5 },
            hover: { y: -2.2, opacity: 1 },
          }}
          transition={{
            duration: 0.4,
            ease: "easeInOut",
            delay: hovered ? i * 0.13 : 0,
          }}
        />
      ))}
    </svg>
  );
}

function LeadsIcon({ hovered, className }: CustomIconProps) {
  return (
    <svg {...SVG_BASE} className={className}>
      <motion.g
        initial="rest"
        animate={hovered ? "hover" : "rest"}
        variants={{
          rest: { x: 0, opacity: 0.55 },
          hover: { x: -1.5, opacity: 1 },
        }}
        transition={SLOW}
      >
        <circle cx={16} cy={7} r={2.5} />
        <path d="M12.5 20v-1.5a4 4 0 0 1 4-4h1a4 4 0 0 1 4 4V20" />
      </motion.g>
      <motion.g
        initial="rest"
        animate={hovered ? "hover" : "rest"}
        variants={{ rest: { scale: 1 }, hover: { scale: 1.06 } }}
        transition={{ ...SLOW, delay: hovered ? 0.08 : 0 }}
        style={{ originX: 0.5, originY: 0.5 }}
      >
        <circle cx={9} cy={8} r={3} />
        <path d="M4 20v-1.5a5 5 0 0 1 5-5h0a5 5 0 0 1 5 5V20" />
      </motion.g>
    </svg>
  );
}

function ServicesIcon({ hovered, className }: CustomIconProps) {
  return (
    <svg {...SVG_BASE} className={className}>
      <path d="M12 3 21 8 12 13 3 8z" />
      <motion.path
        d="M3 12l9 5 9-5"
        initial="rest"
        animate={hovered ? "hover" : "rest"}
        variants={{
          rest: { y: 0, opacity: 0.5 },
          hover: { y: 1.5, opacity: 1 },
        }}
        transition={SLOW}
      />
      <motion.path
        d="M3 16l9 5 9-5"
        initial="rest"
        animate={hovered ? "hover" : "rest"}
        variants={{
          rest: { y: 0, opacity: 0.35 },
          hover: { y: 3, opacity: 1 },
        }}
        transition={{ ...SLOW, delay: hovered ? 0.07 : 0 }}
      />
    </svg>
  );
}

function AIAgentIcon({ hovered, className }: CustomIconProps) {
  return (
    <svg {...SVG_BASE} className={className}>
      <motion.g
        initial="rest"
        animate={hovered ? "hover" : "rest"}
        variants={{ rest: { rotate: 0 }, hover: { rotate: -18 } }}
        transition={SLOW}
        style={{ originX: 0.5, originY: 1 }}
      >
        <line x1={12} y1={2} x2={12} y2={5} />
        <circle cx={12} cy={2} r={0.9} fill="currentColor" stroke="none" />
      </motion.g>
      <rect x={5} y={5} width={14} height={12} rx={3} />
      <motion.line
        x1={9}
        y1={9.7}
        x2={9}
        y2={12.3}
        initial="rest"
        animate={hovered ? "hover" : "rest"}
        variants={{ rest: { scaleY: 1 }, hover: { scaleY: [1, 0.15, 1] } }}
        transition={{
          duration: 0.45,
          ease: "easeInOut",
          delay: hovered ? 0.2 : 0,
        }}
        style={{ originX: 0.5, originY: 0.5 }}
      />
      <motion.line
        x1={15}
        y1={9.7}
        x2={15}
        y2={12.3}
        initial="rest"
        animate={hovered ? "hover" : "rest"}
        variants={{ rest: { scaleY: 1 }, hover: { scaleY: [1, 0.15, 1] } }}
        transition={{
          duration: 0.45,
          ease: "easeInOut",
          delay: hovered ? 0.2 : 0,
        }}
        style={{ originX: 0.5, originY: 0.5 }}
      />
    </svg>
  );
}

function PortfolioIcon({ hovered, className }: CustomIconProps) {
  return (
    <svg {...SVG_BASE} className={className}>
      <motion.path
        d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"
        initial="rest"
        animate={hovered ? "hover" : "rest"}
        variants={{ rest: { y: 0, rotate: 0 }, hover: { y: -1.5, rotate: -4 } }}
        transition={SLOW}
        style={{ originX: 0.5, originY: 1 }}
      />
      <rect x={3} y={7} width={18} height={12} rx={2} />
      <line x1={3} y1={13} x2={21} y2={13} />
    </svg>
  );
}

function BlogIcon({ hovered, className }: CustomIconProps) {
  return (
    <svg {...SVG_BASE} className={className}>
      <path d="M4 4h13a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <line x1={7} y1={8.5} x2={16} y2={8.5} />
      <line x1={7} y1={12} x2={16} y2={12} />
      <line x1={7} y1={15.5} x2={12} y2={15.5} />
      <motion.path
        d="M17 4v4h4"
        initial="rest"
        animate={hovered ? "hover" : "rest"}
        variants={{
          rest: { rotate: 0, scale: 1 },
          hover: { rotate: -14, scale: 1.18 },
        }}
        transition={SLOW}
        style={{ originX: 1, originY: 0 }}
      />
    </svg>
  );
}

function ContactIcon({ hovered, className }: CustomIconProps) {
  return (
    <svg {...SVG_BASE} className={className}>
      <rect x={3} y={6} width={18} height={12} rx={2} />
      <motion.path
        d="M3 7l9 6 9-6"
        initial="rest"
        animate={hovered ? "hover" : "rest"}
        variants={{ rest: { y: 0 }, hover: { y: -1.8 } }}
        transition={SLOW}
      />
    </svg>
  );
}

function AccountIcon({ hovered, className }: CustomIconProps) {
  return (
    <svg {...SVG_BASE} className={className}>
      <motion.circle
        cx={12}
        cy={12}
        r={9.25}
        initial="rest"
        animate={hovered ? "hover" : "rest"}
        variants={{
          rest: { scale: 1, opacity: 0 },
          hover: { scale: 1.22, opacity: [0, 0.5, 0] },
        }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        style={{ originX: 0.5, originY: 0.5 }}
      />
      <circle cx={12} cy={12} r={9.25} />
      <motion.g
        initial="rest"
        animate={hovered ? "hover" : "rest"}
        variants={{ rest: { scale: 1 }, hover: { scale: 1.1 } }}
        transition={{ ...SLOW, delay: hovered ? 0.1 : 0 }}
        style={{ originX: 0.5, originY: 0.5 }}
      >
        <circle cx={12} cy={10} r={2.5} />
        <path d="M7 18a5 5 0 0 1 10 0" />
      </motion.g>
    </svg>
  );
}

// ---------------------------------------------------------------------
// Top-level nav icons — refined pass. Same rule: the anchor shape never
// moves, only one meaningful part animates, on a snappy overshoot spring
// rather than a linear ease, with a slight settle bounce baked in.
// ---------------------------------------------------------------------

// Building2 — frame never moves; windows pop on one after another with
// a small scale-in (not just opacity), like lights switching on.
function Building2Icon({ hovered, className }: CustomIconProps) {
  const windows = [
    { x: 8, y: 6 },
    { x: 8, y: 11 },
    { x: 8, y: 16 },
    { x: 15, y: 13 },
    { x: 15, y: 17 },
  ];
  return (
    <svg {...SVG_BASE} className={className}>
      <path d="M6 22V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v18" />
      <path d="M13 11h4a1 1 0 0 1 1 1v10" />
      <line x1={3} y1={22} x2={21} y2={22} />
      {windows.map((w, i) => (
        <motion.rect
          key={i}
          x={w.x}
          y={w.y}
          width={2.2}
          height={2.2}
          rx={0.4}
          fill="currentColor"
          stroke="none"
          initial="rest"
          animate={hovered ? "hover" : "rest"}
          variants={{
            rest: { opacity: 0.3, scale: 0.8 },
            hover: { opacity: 1, scale: 1 },
          }}
          transition={{
            duration: 0.25,
            ease: "easeOut",
            delay: hovered ? i * 0.07 : 0,
          }}
          style={{ originX: 0.5, originY: 0.5 }}
        />
      ))}
    </svg>
  );
}

// ShieldCheck — shield outline never moves; the checkmark draws itself
// in (path-length reveal), then gives a small confirm-pop on landing.
function ShieldCheckIcon({ hovered, className }: CustomIconProps) {
  return (
    <svg {...SVG_BASE} className={className}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
      <motion.path
        d="M9 12.3l2 2 4-4.6"
        initial="rest"
        animate={hovered ? "hover" : "rest"}
        variants={{
          rest: { pathLength: 1, opacity: 1, scale: 1 },
          hover: { pathLength: [0, 1, 1], opacity: 1, scale: [1, 1.18, 1] },
        }}
        transition={{ duration: 0.5, ease: "easeOut", times: [0, 0.75, 1] }}
        style={{ originX: 0.5, originY: 0.5 }}
      />
    </svg>
  );
}

// Sparkles — main star gives a confident snap-spin+grow on the fast
// spring; the small companion star twinkles a beat later.
function SparklesIcon({ hovered, className }: CustomIconProps) {
  return (
    <svg {...SVG_BASE} className={className}>
      <motion.path
        d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z"
        initial="rest"
        animate={hovered ? "hover" : "rest"}
        variants={{
          rest: { rotate: 0, scale: 1 },
          hover: { rotate: 20, scale: 1.12 },
        }}
        transition={SNAP}
        style={{ originX: 0.5, originY: 0.5 }}
      />
      <motion.path
        d="M18 14l.6 2 2 .6-2 .6-.6 2-.6-2-2-.6 2-.6z"
        initial="rest"
        animate={hovered ? "hover" : "rest"}
        variants={{
          rest: { opacity: 0.4, scale: 0.85 },
          hover: { opacity: 1, scale: 1.2 },
        }}
        transition={{ ...SNAP, delay: hovered ? 0.1 : 0 }}
        style={{ originX: 0.5, originY: 0.5 }}
      />
    </svg>
  );
}

// Palette — palette base holds still; the three color dots pop up in
// sequence on the snap spring, like colors being dabbed on.
function PaletteIcon({ hovered, className }: CustomIconProps) {
  const dots = [
    { cx: 8.5, cy: 9 },
    { cx: 14, cy: 7.5 },
    { cx: 16.5, cy: 12 },
  ];
  return (
    <svg {...SVG_BASE} className={className}>
      <path d="M12 3a9 9 0 1 0 0 18c1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17c2.2 0 4-1.8 4-4 0-4.4-4-8-9-8z" />
      {dots.map((d, i) => (
        <motion.circle
          key={i}
          cx={d.cx}
          cy={d.cy}
          r={1.3}
          fill="currentColor"
          stroke="none"
          initial="rest"
          animate={hovered ? "hover" : "rest"}
          variants={{ rest: { scale: 1 }, hover: { scale: 1.45 } }}
          transition={{ ...SNAP, delay: hovered ? i * 0.08 : 0 }}
          style={{ originX: 0.5, originY: 0.5 }}
        />
      ))}
    </svg>
  );
}

// Radio — center dot stays put; wave arcs fade in outward in sequence,
// like a broadcast pulsing out.
function RadioIcon({ hovered, className }: CustomIconProps) {
  return (
    <svg {...SVG_BASE} className={className}>
      <circle cx={12} cy={12} r={2} fill="currentColor" stroke="none" />
      <motion.path
        d="M16.2 7.8a6 6 0 0 1 0 8.4"
        initial="rest"
        animate={hovered ? "hover" : "rest"}
        variants={{ rest: { opacity: 0.35 }, hover: { opacity: 1 } }}
        transition={SLOW}
      />
      <motion.path
        d="M7.8 7.8a6 6 0 0 0 0 8.4"
        initial="rest"
        animate={hovered ? "hover" : "rest"}
        variants={{ rest: { opacity: 0.35 }, hover: { opacity: 1 } }}
        transition={{ ...SLOW, delay: hovered ? 0.06 : 0 }}
      />
      <motion.path
        d="M19 4.8a10 10 0 0 1 0 14.4"
        initial="rest"
        animate={hovered ? "hover" : "rest"}
        variants={{ rest: { opacity: 0.2 }, hover: { opacity: 0.75 } }}
        transition={{ ...SLOW, delay: hovered ? 0.12 : 0 }}
      />
      <motion.path
        d="M5 4.8a10 10 0 0 0 0 14.4"
        initial="rest"
        animate={hovered ? "hover" : "rest"}
        variants={{ rest: { opacity: 0.2 }, hover: { opacity: 0.75 } }}
        transition={{ ...SLOW, delay: hovered ? 0.18 : 0 }}
      />
    </svg>
  );
}

// KeyRound — the ring (bow) never moves; the shaft/teeth turn around
// the ring's own pivot on the snap spring, like a key turning a lock
// and settling with a tiny overshoot.
function KeyRoundIcon({ hovered, className }: CustomIconProps) {
  return (
    <svg {...SVG_BASE} className={className}>
      <circle cx={7.5} cy={8.5} r={3.5} />
      <motion.g
        initial="rest"
        animate={hovered ? "hover" : "rest"}
        variants={{ rest: { rotate: 0 }, hover: { rotate: -24 } }}
        transition={SNAP}
        style={{ transformOrigin: "7.5px 8.5px" }}
      >
        <path d="M9.9 10.9 18.5 19.5" />
        <path d="M15.5 15 17.5 13" />
        <path d="M17.8 17.3 20 15" />
      </motion.g>
    </svg>
  );
}

// Webhook — connector lines never move; the three nodes pulse through
// in sequence with a small lift, like data flowing through the chain.
function WebhookIcon({ hovered, className }: CustomIconProps) {
  const nodes = [
    { cx: 7, cy: 18 },
    { cx: 16, cy: 4.5 },
    { cx: 19, cy: 18 },
  ];
  return (
    <svg {...SVG_BASE} className={className}>
      <path d="M7 18a4 4 0 1 1 3.3-6.3" />
      <path d="M11.1 11.4 16 4.5" />
      <path d="M13 18h6a3 3 0 0 0 1.4-5.6L18 11" />
      {nodes.map((n, i) => (
        <motion.circle
          key={i}
          cx={n.cx}
          cy={n.cy}
          r={1.6}
          fill="currentColor"
          stroke="none"
          initial="rest"
          animate={hovered ? "hover" : "rest"}
          variants={{
            rest: { scale: 1, opacity: 0.5, y: 0 },
            hover: { scale: 1.35, opacity: 1, y: -0.8 },
          }}
          transition={{ ...SNAP, delay: hovered ? i * 0.09 : 0 }}
          style={{ originX: 0.5, originY: 0.5 }}
        />
      ))}
    </svg>
  );
}

// CreditCard — card lifts and tilts like it's being handed over on the
// soft spring; the chip glows with a snappier pop a beat later.
function CreditCardIcon({ hovered, className }: CustomIconProps) {
  return (
    <svg {...SVG_BASE} className={className}>
      <motion.g
        initial="rest"
        animate={hovered ? "hover" : "rest"}
        variants={{ rest: { rotate: 0, y: 0 }, hover: { rotate: -6, y: -1.5 } }}
        transition={SOFT_SPRING}
        style={{ originX: 0.5, originY: 0.5 }}
      >
        <rect x={2} y={5} width={20} height={14} rx={2} />
        <line x1={2} y1={10} x2={22} y2={10} />
        <motion.rect
          x={5}
          y={14}
          width={5}
          height={2}
          rx={0.5}
          fill="currentColor"
          stroke="none"
          initial="rest"
          animate={hovered ? "hover" : "rest"}
          variants={{
            rest: { opacity: 0.4, scale: 1 },
            hover: { opacity: 1, scale: 1.1 },
          }}
          transition={{ ...SNAP, delay: hovered ? 0.15 : 0 }}
          style={{ originX: 0.5, originY: 0.5 }}
        />
      </motion.g>
    </svg>
  );
}

// Settings — accurate gear silhouette, turns as one piece (a gear
// turning IS the whole-icon motion) but with an eased feel rather than
// a linear snap, so it reads as deliberate rather than mechanical.
function SettingsIcon({ hovered, className }: CustomIconProps) {
  return (
    <svg {...SVG_BASE} className={className}>
      <motion.g
        initial="rest"
        animate={hovered ? "hover" : "rest"}
        variants={{ rest: { rotate: 0 }, hover: { rotate: 90 } }}
        transition={GEAR_TURN}
        style={{ originX: 0.5, originY: 0.5 }}
      >
        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.14.34.34.65.6.9.25.25.56.45.9.6.34.14.72.2 1.1.2H23a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z" />
      </motion.g>
    </svg>
  );
}

/**
 * Maps the exact Lucide component references already used across
 * site.ts / PlatformShell.tsx to a hand-built replacement. NavIcon
 * (nav-icon-motion.tsx) checks this map first; anything not listed
 * here falls back to the simpler spring transform/scale treatment.
 *
 * Includes both the original dropdown-panel icons and the top-level
 * nav icons (Building2, ShieldCheck, Sparkles, Palette, Radio,
 * KeyRound, Webhook, CreditCard, Settings) that previously used the
 * generic ICON_MOTION fallback.
 */
export const CUSTOM_NAV_ICONS = new Map<
  LucideIcon,
  React.ComponentType<CustomIconProps>
>([
  [LayoutDashboard, DashboardIcon],
  [BookOpen, KnowledgeBaseIcon],
  [MessagesSquare, InboxIcon],
  [Users, LeadsIcon],
  [Layers, ServicesIcon],
  [Bot, AIAgentIcon],
  [Briefcase, PortfolioIcon],
  [Newspaper, BlogIcon],
  [Mail, ContactIcon],
  [CircleUserRound, AccountIcon],
  [Building2, Building2Icon],
  [ShieldCheck, ShieldCheckIcon],
  [Sparkles, SparklesIcon],
  [Palette, PaletteIcon],
  [Radio, RadioIcon],
  [KeyRound, KeyRoundIcon],
  [Webhook, WebhookIcon],
  [CreditCard, CreditCardIcon],
  [Settings, SettingsIcon],
]);
