import type { UIMessage } from "ai";
import { motion } from "framer-motion";
import { Sparkles, User } from "lucide-react";
import { renderMarkdownLite } from "@/lib/chat/markdown";
import { EstimateCard, type EstimateOutput } from "./EstimateCard";
import {
  PortfolioResults,
  type PortfolioSearchOutput,
} from "./PortfolioResults";
import { HandoffButtons, type HandoffOutput } from "./HandoffButtons";

function Avatar({ isUser }: { isUser: boolean }) {
  return (
    <div
      className={[
        "flex h-7 w-7 flex-none items-center justify-center rounded-full",
        isUser ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent",
      ].join(" ")}
    >
      {isUser ? (
        <User className="h-3.5 w-3.5" strokeWidth={2} />
      ) : (
        <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
      )}
    </div>
  );
}

/**
 * Renders one AI SDK v6 UIMessage. `showAvatar` controls message
 * grouping — only the first message in a consecutive run from the
 * same sender shows an avatar, matching the Intercom/Crisp pattern of
 * grouping consecutive turns instead of repeating chrome per bubble.
 */
export function MessageBubble({
  message,
  showAvatar,
}: {
  message: UIMessage;
  showAvatar: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <>
      {message.parts.map((part, index) => {
        const key = `${message.id}-${index}`;

        if (part.type === "text") {
          const text = (part as { text?: string }).text;
          if (!text) return null;
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`flex items-end gap-2 ${
                isUser ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div className="w-7 flex-none">
                {showAvatar && <Avatar isUser={isUser} />}
              </div>
              <div
                className={[
                  "max-w-[78%] rounded-2xl px-4 py-2.5 font-body text-sm leading-relaxed [&_p+p]:mt-1.5",
                  isUser
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md border border-border bg-card text-foreground",
                ].join(" ")}
              >
                {renderMarkdownLite(text)}
              </div>
            </motion.div>
          );
        }

        if (part.type === "tool-generateEstimate") {
          const toolPart = part as { state: string; output?: EstimateOutput };
          if (toolPart.state === "output-available" && toolPart.output) {
            return <EstimateCard key={key} estimate={toolPart.output} />;
          }
          if (
            toolPart.state === "input-streaming" ||
            toolPart.state === "input-available"
          ) {
            return (
              <div
                key={key}
                className="ml-9 max-w-[85%] rounded-2xl border border-border bg-card px-4 py-2.5 font-body text-sm text-muted-foreground"
              >
                Calculating your estimate…
              </div>
            );
          }
          if (toolPart.state === "output-error") {
            return (
              <div
                key={key}
                className="ml-9 max-w-[85%] rounded-2xl border border-error/30 bg-error/10 px-4 py-2.5 font-body text-sm text-error"
              >
                Couldn&apos;t calculate an estimate — try rephrasing, or ask to
                talk to the team.
              </div>
            );
          }
          return null;
        }

        if (part.type === "tool-searchPortfolio") {
          const toolPart = part as {
            state: string;
            output?: PortfolioSearchOutput;
          };
          if (toolPart.state === "output-available" && toolPart.output) {
            return <PortfolioResults key={key} result={toolPart.output} />;
          }
          return null;
        }

        if (part.type === "tool-requestHandoff") {
          const toolPart = part as { state: string; output?: HandoffOutput };
          if (toolPart.state === "output-available" && toolPart.output) {
            return <HandoffButtons key={key} handoff={toolPart.output} />;
          }
          return null;
        }

        return null;
      })}
    </>
  );
}
