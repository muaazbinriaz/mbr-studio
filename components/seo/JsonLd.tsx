/**
 * Renders a JSON-LD <script> tag from a schema.org object.
 * Usage: <JsonLd data={organizationSchema()} />
 *
 * Safe against script-injection: JSON.stringify escapes quotes, and we
 * additionally strip "</" sequences so the payload can't prematurely
 * close the surrounding <script> tag if a description ever contains
 * literal HTML-like text.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
