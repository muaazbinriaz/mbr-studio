import { motion } from "framer-motion";
import { MessageCircle, CalendarCheck, Mail } from "lucide-react";

export interface HandoffOutput {
  reason: string;
  whatsappUrl: string;
  consultationUrl: string;
  contactEmail: string;
}

export function HandoffButtons({ handoff }: { handoff: HandoffOutput }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="ml-9 flex max-w-[85%] flex-col gap-2 rounded-2xl border border-border bg-card p-3"
    >
      <a
        href={handoff.whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-success px-3.5 py-2 font-body text-sm font-medium text-primary-foreground transition-colors hover:bg-success/90"
      >
        <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
        Chat on WhatsApp
      </a>

      <a
        href={handoff.consultationUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 font-body text-sm font-medium text-foreground transition-colors hover:bg-background"
      >
        <CalendarCheck className="h-4 w-4" strokeWidth={1.75} />
        Book a Consultation
      </a>

      <a
        href={`mailto:${handoff.contactEmail}`}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 font-body text-sm font-medium text-foreground transition-colors hover:bg-background"
      >
        <Mail className="h-4 w-4" strokeWidth={1.75} />
        Email us
      </a>
    </motion.div>
  );
}
