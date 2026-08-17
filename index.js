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
  // Reads whatever sitemap-worker last wrote — that separate Worker runs
  // on its own Cron Trigger every 6 hours, queries Supabase for public,
  // completed miniatures, and stores the built XML under the key
  // "sitemap.xml" in this same KV namespace. This function does no
  // database work itself, it just serves whatever's cached.
  const xml = await env.SITEMAP_CACHE.get("sitemap.xml");

  if (!xml) {
    // Worker hasn't run yet (e.g. right after first deploy, or KV is
    // briefly empty). Serve an empty-but-valid sitemap rather than an
    // error, so nothing breaks while waiting for the first cron tick.
    return new Response(
      `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      { headers: { "Content-Type": "application/xml" } }
    );
  }

  return new Response(xml, {
    headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
  });
}
