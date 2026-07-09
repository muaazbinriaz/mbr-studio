"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

/** Wraps a grid/list; children should be StaggerItem. */
export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.08,
  maxDelay = 0.6,
  ...rest
}: HTMLMotionProps<"div"> & { staggerDelay?: number; maxDelay?: number }) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: {},
        show: {
          transition: shouldReduceMotion
            ? {}
            : {
                // caps total stagger regardless of item count
                staggerChildren: Math.min(staggerDelay, maxDelay),
                staggerDirection: 1,
                delayChildren: 0,
                when: "beforeChildren",
              },
        },
      }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  y = 16,
  ...rest
}: HTMLMotionProps<"div"> & { y?: number }) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      variants={{
        hidden: shouldReduceMotion ? {} : { opacity: 0, y },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, ease: "easeOut" },
        },
      }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
