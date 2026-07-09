import type { ReactNode } from "react";

/**
 * Minimal, dependency-free markdown-ish renderer for chat text.
 * Supports: **bold**, `inline code`, "- " bullet lines, and paragraphs.
 * Not a full markdown parser — just enough for how the model actually
 * formats replies (see system-prompt.ts's list-formatting instruction).
 */
function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|`(.+?)`|\[(.+?)\]\((.+?)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2] !== undefined) {
      parts.push(
        <strong key={key++} className="font-semibold">
          {match[2]}
        </strong>,
      );
    } else if (match[3] !== undefined) {
      parts.push(
        <code
          key={key++}
          className="rounded bg-background px-1.5 py-0.5 font-mono text-[0.85em]"
        >
          {match[3]}
        </code>,
      );
    } else if (match[4] !== undefined && match[5] !== undefined) {
      parts.push(
        <a
          key={key++}
          href={match[5]}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-accent"
        >
          {match[4]}
        </a>,
      );
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

export function renderMarkdownLite(text: string): ReactNode {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let bulletBuffer: string[] = [];
  let key = 0;

  const flushBullets = () => {
    if (bulletBuffer.length === 0) return;
    blocks.push(
      <ul key={key++} className="my-1 flex flex-col gap-1 pl-4">
        {bulletBuffer.map((b, i) => (
          <li key={i} className="list-disc marker:text-primary">
            {renderInline(b)}
          </li>
        ))}
      </ul>,
    );
    bulletBuffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith("- ")) {
      bulletBuffer.push(line.slice(2));
      continue;
    }
    flushBullets();
    if (line.length === 0) continue; // collapse blank lines instead of empty <p>
    blocks.push(
      <p key={key++} className="text-inherit">
        {renderInline(line)}
      </p>,
    );
  }
  flushBullets();

  return <>{blocks}</>;
}
