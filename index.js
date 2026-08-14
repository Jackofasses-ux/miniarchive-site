const SUPABASE_URL = "https://oesjjvrofwlhcxilwaen.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lc2pqdnJvZndsaGN4aWx3YWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3Mzg5MDEsImV4cCI6MjEwMDMxNDkwMX0.Tazlir8gkSk8Y-aQMFOjmgadCgOhyaTfV8p8dWi9thw";
const BASE_URL = "https://www.miniarchive.net";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/sitemap.xml") {
      return generateSitemap();
    }
    return env.ASSETS.fetch(request);
  },
};

async function generateSitemap() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/miniatures?select=id,updated_at&visibility=eq.public&status=eq.completed`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
  );
  const records = res.ok ? await res.json() : [];
  const staticUrls = [
    { loc: `${BASE_URL}/`, changefreq: "weekly", priority: "1.0" },
    { loc: `${BASE_URL}/archive.html`, changefreq: "daily", priority: "0.9" },
  ];
  const recordUrls = records.map(r => ({
    loc: `${BASE_URL}/record.html?id=${r.id}`,
    lastmod: (r.updated_at || "").slice(0, 10),
    changefreq: "monthly",
    priority: "0.7",
  }));
  const urlXml = [...staticUrls, ...recordUrls].map(u => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlXml}\n</urlset>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
  });
}
