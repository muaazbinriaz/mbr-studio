import { FadeIn } from "@/components/animations/FadeIn";

const STATS = [
  { value: "3", label: "Products shipped" },
  { value: "100%", label: "Client-owned code & accounts" },
  { value: "1–2 days", label: "Typical response time" },
];

export function StatsBar() {
  return (
    <section className="border-t border-border bg-secondary-background">
      <div className="mx-auto max-w-4xl px-6 py-16 md:px-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {STATS.map((stat, i) => (
            <FadeIn
              key={stat.label}
              delay={i * 0.08}
              viewport={{ once: true, amount: 0.6 }}
              className="text-center"
            >
              <p className="font-heading text-3xl font-bold text-text sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1 font-body text-sm text-secondary-text">
                {stat.label}
              </p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
