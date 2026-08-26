const SITE_URL = "https://miniarchive.net";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/sitemap.xml") {
      return serveSitemap(env);
    }
    return env.ASSETS.fetch(request);
  },
};

async function serveSitemap(env) {
  // Keep normal page delivery completely untouched. The sitemap is the only
  // response transformed by this Worker.
  const cached = await env.SITEMAP_CACHE.get("sitemap.xml");
  let xml = cached || `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;

  // Use one canonical host. Preserve the record URLs produced by the existing
  // sitemap cron until the route migration is deployed and verified separately.
  xml = xml.replaceAll("https://www.miniarchive.net", SITE_URL);

  const publicPages = ["/", "/archive.html", "/features.html", "/about.html"];
  const existing = new Set(Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/g), match => match[1]));
  const additions = publicPages
    .map(path => `${SITE_URL}${path}`)
    .filter(loc => !existing.has(loc))
    .map(loc => `<url><loc>${loc}</loc></url>`)
    .join("");

  if (additions) xml = xml.replace("</urlset>", `${additions}</urlset>`);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
