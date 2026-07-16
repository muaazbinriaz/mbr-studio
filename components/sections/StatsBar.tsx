import { FadeIn } from "@/components/animations/FadeIn";
import { Rocket, KeyRound, Zap, type LucideIcon } from "lucide-react";

const STATS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "3", label: "Production-ready Projects", icon: Rocket },
  { value: "100%", label: "Client-owned Code & Accounts", icon: KeyRound },
  { value: "1–2 days", label: "Fast, Direct Communication", icon: Zap },
];

export function StatsBar() {
  return (
    <section className="border-t border-border bg-secondary-background">
      <div className="mx-auto max-w-5xl px-6 py-16 md:px-10 md:py-20">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
          {STATS.map((stat, i) => (
            <FadeIn
              key={stat.label}
              delay={i * 0.08}
              viewport={{ once: true, amount: 0.6 }}
              className="gradient-ring glass-card group flex flex-col items-center gap-3 rounded-2xl px-6 py-8 text-center transition-transform duration-300 hover:-translate-y-1"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/15">
                <stat.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="bg-gradient-to-r from-primary to-accent bg-clip-text font-heading text-4xl font-bold text-transparent sm:text-5xl">
                {stat.value}
              </p>
              <p className="font-body text-sm text-secondary-text">
                {stat.label}
              </p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
