export function AuthorCard({
  name,
  role = "Founder, MBR Studio",
}: {
  name: string;
  role?: string;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6">
      <div
        aria-hidden="true"
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-lg font-semibold text-white"
      >
        {initials}
      </div>
      <div>
        <p className="font-heading text-base font-semibold text-text">{name}</p>
        <p className="text-sm text-secondary-text">{role}</p>
      </div>
    </div>
  );
}
