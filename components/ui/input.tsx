import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full rounded-lg border border-border bg-secondary-background px-3 py-2 text-sm text-foreground placeholder:text-secondary-text transition-colors duration-200 hover:border-foreground/30 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 md:h-10",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
