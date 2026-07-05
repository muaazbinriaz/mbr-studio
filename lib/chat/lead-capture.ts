/**
 * Sentinel-marker convention for signalling the widget to render the
 * lead capture form. The widget chat route streams plain text (no
 * structured message parts), so this marker is appended to the very
 * end of the text stream once the full reply is known — the widget's
 * client JS strips it before display and uses its presence to trigger
 * the inline capture form.
 */
export const LEAD_CAPTURE_MARKER = "\n\n[[MBR_LEAD_CAPTURE]]";

const FALLBACK_PATTERNS: RegExp[] = [
  /don'?t have that (information\s)?on hand/i,
  /i'?m not sure (about|regarding)?/i,
  /you'?d need to contact (them|us|the team) directly/i,
  /let the team know you'?re asking/i,
  /i don'?t have (enough |that )?information/i,
  /reach out to (the|our) team/i,
  /i'?m not able to answer that/i,
];

export function isFallbackReply(text: string): boolean {
  return FALLBACK_PATTERNS.some((re) => re.test(text));
}

/**
 * Wraps a plain-text ReadableStream so that, once the full reply is
 * known, we can decide whether to append the sentinel marker. The
 * normal text streams through completely unmodified — the marker is
 * purely additive, appended once, right at the end.
 *
 * onDetected fires exactly once, only when the marker is actually
 * appended — the caller uses it to persist "shown" state so the same
 * conversation isn't prompted on every subsequent fallback reply.
 */
export function withLeadCaptureMarker(
  textStream: ReadableStream<Uint8Array>,
  shouldCheck: boolean,
  onDetected: () => void | Promise<void>,
): ReadableStream<Uint8Array> {
  if (!shouldCheck) return textStream;

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let fullText = "";

  return new ReadableStream({
    async start(controller) {
      const reader = textStream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
          controller.enqueue(value);
        }

        if (isFallbackReply(fullText)) {
          controller.enqueue(encoder.encode(LEAD_CAPTURE_MARKER));
          await onDetected();
        }
      } catch (err) {
        controller.error(err);
        return;
      }
      controller.close();
    },
  });
}
