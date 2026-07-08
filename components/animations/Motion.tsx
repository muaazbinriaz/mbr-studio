"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

/** Lift + shadow on hover for cards. */
export function HoverLift({
  children,
  className,
  ...rest
}: HTMLMotionProps<"div">) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      whileHover={shouldReduceMotion ? undefined : { y: -3 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "transition-shadow duration-200 hover:shadow-lg",
        className,
      )}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Small scale bump for icon buttons/badges. */
export function ScaleOnHover({
  children,
  className,
  scale = 1.08,
  ...rest
}: HTMLMotionProps<"div"> & { scale?: number }) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      whileHover={shouldReduceMotion ? undefined : { scale }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

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
                staggerChildren: staggerDelay,
                staggerDirection: 1,
                delayChildren: 0,
                when: "beforeChildren",
                // caps total stagger regardless of item count
                staggerChildren: Math.min(staggerDelay, maxDelay),
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
