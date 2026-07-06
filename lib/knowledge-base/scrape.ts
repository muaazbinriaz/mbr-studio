import * as cheerio from "cheerio";

const USER_AGENT = "MBRStudioBot/1.0 (+https://mbrstudio.dev)";
const REQUEST_TIMEOUT_MS = 8000;
const MAX_DISCOVERED_PAGES = 18;
const PRIORITY_PATH_HINTS = [
  "/about",
  "/services",
  "/pricing",
  "/faq",
  "/contact",
];

export interface DiscoveredPage {
  url: string;
  title: string;
}

interface RobotsRules {
  disallowedPaths: string[];
}

async function fetchWithTimeout(url: string, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Minimal robots.txt parser — good enough for the small-business sites
 * this feature targets. Reads the block matching our bot's user-agent
 * if present, otherwise the `*` block, and collects every Disallow
 * path from that block. Doesn't handle every edge case of the spec
 * (e.g. multiple User-agent lines sharing one rule block) but that's
 * rare in practice and failing open (treating unparseable robots.txt
 * as "nothing disallowed") is the safer default than blocking a crawl
 * over a parsing gap.
 */
async function fetchRobotsRules(origin: string): Promise<RobotsRules> {
  try {
    const res = await fetchWithTimeout(`${origin}/robots.txt`, 5000);
    if (!res.ok) return { disallowedPaths: [] };
    const body = await res.text();

    const lines = body.split("\n").map((l) => l.trim());
    let matchesUs = false;
    let matchesWildcard = false;
    const wildcardDisallows: string[] = [];
    const usDisallows: string[] = [];

    for (const rawLine of lines) {
      const line = rawLine.split("#")[0].trim();
      if (!line) continue;

      const [rawKey, ...rest] = line.split(":");
      const key = rawKey.trim().toLowerCase();
      const value = rest.join(":").trim();

      if (key === "user-agent") {
        const agent = value.toLowerCase();
        matchesWildcard = agent === "*";
        matchesUs = agent.includes("mbrstudiobot");
        continue;
      }

      if (key === "disallow" && value) {
        if (matchesUs) usDisallows.push(value);
        else if (matchesWildcard) wildcardDisallows.push(value);
      }
    }

    return {
      disallowedPaths: usDisallows.length > 0 ? usDisallows : wildcardDisallows,
    };
  } catch {
    return { disallowedPaths: [] };
  }
}

function isDisallowed(pathname: string, rules: RobotsRules): boolean {
  return rules.disallowedPaths.some(
    (disallowed) => disallowed !== "" && pathname.startsWith(disallowed),
  );
}

function isContentLink(href: string): boolean {
  if (!href) return false;
  const lower = href.toLowerCase();
  if (lower.startsWith("mailto:") || lower.startsWith("tel:")) return false;
  if (lower.startsWith("#")) return false;
  if (/\.(pdf|jpe?g|png|gif|svg|zip|docx?|xlsx?|mp4|mp3)$/.test(lower))
    return false;
  return true;
}

async function tryDiscoverViaSitemap(
  origin: string,
  rules: RobotsRules,
): Promise<DiscoveredPage[] | null> {
  try {
    const res = await fetchWithTimeout(`${origin}/sitemap.xml`, 6000);
    if (!res.ok) return null;
    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });

    const urls: string[] = [];
    $("url > loc").each((_, el) => {
      const loc = $(el).text().trim();
      if (loc) urls.push(loc);
    });
    if (urls.length === 0) return null;

    const filtered = urls
      .filter((url) => {
        try {
          const parsed = new URL(url);
          return (
            parsed.origin === origin && !isDisallowed(parsed.pathname, rules)
          );
        } catch {
          return false;
        }
      })
      .slice(0, MAX_DISCOVERED_PAGES);

    return filtered.map((url) => ({ url, title: url }));
  } catch {
    return null;
  }
}

export async function discoverPages(
  rootUrl: string,
): Promise<DiscoveredPage[]> {
  const root = new URL(rootUrl);
  const origin = root.origin;
  const rules = await fetchRobotsRules(origin);

  const viaSitemap = await tryDiscoverViaSitemap(origin, rules);
  if (viaSitemap && viaSitemap.length > 0) return viaSitemap;

  if (isDisallowed(root.pathname, rules)) return [];

  const res = await fetchWithTimeout(rootUrl);
  if (!res.ok)
    throw new Error(`Could not fetch ${rootUrl} (status ${res.status}).`);

  const html = await res.text();
  const $ = cheerio.load(html);

  const seen = new Set<string>([root.href]);
  const candidates: DiscoveredPage[] = [
    { url: root.href, title: $("title").first().text().trim() || root.href },
  ];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href || !isContentLink(href)) return;

    let resolved: URL;
    try {
      resolved = new URL(href, origin);
    } catch {
      return;
    }

    if (resolved.origin !== origin) return;
    if (isDisallowed(resolved.pathname, rules)) return;

    const normalized = resolved.href.split("#")[0];
    if (seen.has(normalized)) return;
    seen.add(normalized);

    candidates.push({
      url: normalized,
      title: $(el).text().trim() || normalized,
    });
  });

  const prioritized = candidates.filter((page) =>
    PRIORITY_PATH_HINTS.some((hint) =>
      new URL(page.url).pathname.toLowerCase().includes(hint),
    ),
  );
  const rest = candidates.filter((page) => !prioritized.includes(page));

  return [...prioritized, ...rest].slice(0, MAX_DISCOVERED_PAGES);
}

export async function scrapePage(
  url: string,
): Promise<{ title: string; text: string }> {
  const res = await fetchWithTimeout(url);
  if (!res.ok)
    throw new Error(`Could not fetch ${url} (status ${res.status}).`);

  const html = await res.text();
  const $ = cheerio.load(html);
  $("script, style, nav, footer, noscript").remove();

  const title = $("title").first().text().trim() || url;
  const text = $("body").text().replace(/\s+/g, " ").trim();

  return { title, text };
}
