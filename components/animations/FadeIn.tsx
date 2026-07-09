"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

const MOTION_TAGS = {
  div: motion.div,
  li: motion.li,
} as const;

type FadeInProps = Omit<HTMLMotionProps<"div">, "initial" | "whileInView"> & {
  delay?: number;
  y?: number;
  as?: keyof typeof MOTION_TAGS;
};

export function FadeIn({
  children,
  delay = 0,
  y = 16,
  className,
  viewport,
  transition,
  as = "div",
  ...rest
}: FadeInProps) {
  const shouldReduceMotion = useReducedMotion();
  // Cast to a concrete motion component type to avoid the union-of-components
  // type conflict (e.g. onCopy) without using `any`.
  const MotionTag = MOTION_TAGS[as] as typeof motion.div;

  return (
    <MotionTag
      className={className}
      initial={shouldReduceMotion ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewport ?? { once: true, margin: "-80px" }}
      transition={transition ?? { duration: 0.5, delay, ease: "easeOut" }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
