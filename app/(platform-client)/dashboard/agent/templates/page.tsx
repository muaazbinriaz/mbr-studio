import { AGENT_TEMPLATES } from "@/lib/agents/templates";
import { TemplatesClient } from "./TemplatesClient";

export default function TemplatesPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Industry Templates
      </h1>
      <p className="mt-2 font-body text-sm text-secondary-text">
        Apply a template to instantly set up guardrails, starter FAQs, and
        greeting chips for your industry. You can edit everything afterward — a
        template is a starting point, not a lock-in.
      </p>
      <div className="mt-8">
        <TemplatesClient templates={AGENT_TEMPLATES} />
      </div>
    </div>
  );
}
