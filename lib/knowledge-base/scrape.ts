import * as cheerio from "cheerio";
import { isIP } from "node:net";
import { lookup as dnsLookup } from "node:dns/promises";

const USER_AGENT = "MBRStudioBot/1.0 (+https://mbrstudio.dev)";
const REQUEST_TIMEOUT_MS = 8000;
const MAX_DISCOVERED_PAGES = 18;
const MAX_REDIRECTS = 5;
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

/**
 * SSRF guard. Rejects any URL whose hostname is not http/https, or whose
 * resolved IP falls in a loopback / private / link-local / reserved range —
 * this is what blocks cloud metadata endpoints (169.254.169.254), localhost,
 * and internal 10.x/172.16-31.x/192.168.x addresses from being fetched by
 * this server-side scraper on behalf of an authenticated org member.
 */
function isBlockedIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;
    if (a === 127) return true; // loopback
    if (a === 10) return true; // private
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 0) return true; // "this" network
    if (a >= 224) return true; // multicast/reserved
    return false;
  }
  if (version === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true; // loopback
    if (lower.startsWith("fe80:")) return true; // link-local
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local
    if (lower.startsWith("::ffff:")) {
      // IPv4-mapped IPv6 — re-check the embedded v4 address
      const mapped = lower.replace("::ffff:", "");
      return isIP(mapped) === 4 ? isBlockedIp(mapped) : true;
    }
    return false;
  }
  return true; // couldn't parse — fail closed
}

async function assertSafeUrl(urlString: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new Error("Invalid URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http/https URLs are allowed.");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new Error("Requests to localhost are not allowed.");
  }

  // If the hostname is already a literal IP, check it directly.
  if (isIP(hostname)) {
    if (isBlockedIp(hostname)) {
      throw new Error(
        "Requests to internal or private addresses are not allowed.",
      );
    }
    return;
  }

  // Otherwise resolve DNS ourselves and check every returned address —
  // this is what catches DNS rebinding (a public hostname that resolves
  // to a private IP either now or on a subsequent lookup).
  let addresses: { address: string }[];
  try {
    addresses = await dnsLookup(hostname, { all: true });
  } catch {
    throw new Error(`Could not resolve host: ${hostname}`);
  }

  if (addresses.length === 0 || addresses.some((a) => isBlockedIp(a.address))) {
    throw new Error(
      "Requests to internal or private addresses are not allowed.",
    );
  }
}

/**
 * Fetch with the SSRF guard applied on the initial URL and re-applied on
 * every redirect hop. Redirects are followed manually (redirect: "manual")
 * so a public URL that later 302s to an internal address can't bypass the
 * check the way it would under fetch's default automatic redirect handling.
 */
async function fetchWithTimeout(url: string, timeoutMs = REQUEST_TIMEOUT_MS) {
  let currentUrl = url;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertSafeUrl(currentUrl);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetch(currentUrl, {
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT },
        redirect: "manual",
      });
    } finally {
      clearTimeout(timer);
    }

    const isRedirect = res.status >= 300 && res.status < 400;
    const location = res.headers.get("location");
    if (!isRedirect || !location) return res;

    currentUrl = new URL(location, currentUrl).href;
  }

  throw new Error("Too many redirects.");
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

// Elements that are structurally never real page content. Cookie/consent
// banners and skip-links in particular live OUTSIDE <nav>/<header>/<footer>
// on most sites (including this one — see CookieConsent and SkipLink in
// app/layout.tsx, both siblings of <main>, not nested inside it), so
// removing just nav/footer/header misses them entirely. Matched
// heuristically since every consent-banner library names things
// differently and there's no single semantic tag for "cookie banner".
const BOILERPLATE_SELECTORS = [
  "script",
  "style",
  "noscript",
  "nav",
  "header",
  "footer",
  "a[href^='#main']",
  ".sr-only",
  "[class*='skip-link' i]",
  "[class*='cookie' i]",
  "[id*='cookie' i]",
  "[class*='consent' i]",
  "[id*='consent' i]",
  "[aria-label*='cookie' i]",
  "[role='banner']",
  "[role='navigation']",
].join(", ");

export async function scrapePage(
  url: string,
): Promise<{ title: string; text: string }> {
  const res = await fetchWithTimeout(url);
  if (!res.ok)
    throw new Error(`Could not fetch ${url} (status ${res.status}).`);

  const html = await res.text();
  const $ = cheerio.load(html);
  $(BOILERPLATE_SELECTORS).remove();

  const title = $("title").first().text().trim() || url;

  // Prefer the page's actual content region over the whole <body>. Sites
  // built with a conventional layout (including this one — see
  // <main id="main-content"> in app/(marketing)/layout.tsx) wrap real
  // content in <main>, with nav, header CTAs, and cookie banners rendered
  // as siblings outside it. Using <main> when present skips all of that
  // boilerplate at the source instead of trying to blacklist every
  // possible container after the fact. Falls back to <body> for pages
  // that don't use <main> (e.g. a client's non-Next.js site).
  const contentRoot = $("main").first().length ? $("main").first() : $("body");
  const text = contentRoot.text().replace(/\s+/g, " ").trim();

  return { title, text };
}
