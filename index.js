const SITE_URL = "https://miniarchive.net";
const SUPABASE_URL = "https://oesjjvrofwlhcxilwaen.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lc2pqdnJvZndsaGN4aWx3YWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3Mzg5MDEsImV4cCI6MjEwMDMxNDkwMX0.Tazlir8gkSk8Y-aQMFOjmgadCgOhyaTfV8p8dWi9thw";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/sitemap.xml") return serveSitemap(env);

    // Record pages keep using the existing, proven static application route.
    // For anonymous GETs we only enrich <head> at the edge; body markup,
    // JavaScript, auth, Supabase calls and relative asset URLs are untouched.
    if (request.method === "GET" && url.pathname === "/record.html" && url.searchParams.get("id")) {
      return serveRecordWithMetadata(request, env, url.searchParams.get("id"));
    }

    return env.ASSETS.fetch(request);
  },
};

async function serveRecordWithMetadata(request, env, archiveId) {
  const assetResponse = await env.ASSETS.fetch(request);
  if (!assetResponse.ok || !assetResponse.headers.get("content-type")?.includes("text/html")) return assetResponse;

  const record = await fetchPublicRecord(archiveId);
  if (!record) return assetResponse;

  const canonical = `${SITE_URL}/record.html?id=${encodeURIComponent(record.archive_id)}`;
  const painter = record.painter_name || record.painter_profile?.display_name || record.painter_profile?.username || "";
  const title = `${record.title}${record.manufacturer ? ` — ${record.manufacturer}` : ""} | Mini Archive`;
  const description = [record.title, painter ? `painted by ${painter}` : "", record.manufacturer, record.description]
    .filter(Boolean).join(" · ").replace(/\s+/g, " ").slice(0, 160);
  const front = (record.photos || []).find(photo => photo.photo_type === "front");
  const image = (front || record.photos?.[0])?.image_url || "";

  const schema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: record.title,
    description,
    url: canonical,
    identifier: record.archive_id,
    isPartOf: { "@type": "WebSite", name: "Mini Archive", url: SITE_URL },
  };
  if (painter) schema.creator = { "@type": "Person", name: painter };
  if (record.manufacturer) schema.brand = { "@type": "Brand", name: record.manufacturer };
  if (record.completed_at) schema.dateCreated = record.completed_at;
  if (image) schema.image = image;

  return new HTMLRewriter()
    .on("title", { element(element) { element.setInnerContent(title); } })
    .on("head", { element(element) {
      element.append(`<meta name="description" content="${escapeAttribute(description)}">`, { html: true });
      element.append(`<link rel="canonical" href="${escapeAttribute(canonical)}">`, { html: true });
      element.append(`<meta property="og:type" content="article"><meta property="og:site_name" content="Mini Archive"><meta property="og:title" content="${escapeAttribute(title)}"><meta property="og:description" content="${escapeAttribute(description)}"><meta property="og:url" content="${escapeAttribute(canonical)}">`, { html: true });
      if (image) element.append(`<meta property="og:image" content="${escapeAttribute(image)}">`, { html: true });
      element.append(`<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}"><meta name="twitter:title" content="${escapeAttribute(title)}"><meta name="twitter:description" content="${escapeAttribute(description)}">`, { html: true });
      if (image) element.append(`<meta name="twitter:image" content="${escapeAttribute(image)}">`, { html: true });
      element.append(`<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>`, { html: true });
    }})
    .transform(assetResponse);
}

async function fetchPublicRecord(archiveId) {
  const select = "archive_id,title,manufacturer,description,completed_at,painter_name,photos(image_url,photo_type),painter_profile:profiles!painter_profile_id(username,display_name)";
  const endpoint = `${SUPABASE_URL}/rest/v1/miniatures?select=${encodeURIComponent(select)}&archive_id=eq.${encodeURIComponent(archiveId)}&limit=1`;
  try {
    const response = await fetch(endpoint, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } });
    if (!response.ok) return null;
    const rows = await response.json();
    return rows[0] || null;
  } catch (error) {
    console.error("Record metadata lookup failed", error);
    return null;
  }
}

function escapeAttribute(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;").replace(/\n/g, " ");
}

async function serveSitemap(env) {
  const cached = await env.SITEMAP_CACHE.get("sitemap.xml");
  let xml = cached || `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
  xml = xml.replaceAll("https://www.miniarchive.net", SITE_URL);

  const publicPages = ["/", "/archive.html", "/features.html", "/about.html"];
  const existing = new Set(Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/g), match => match[1]));
  const additions = publicPages.map(path => `${SITE_URL}${path}`).filter(loc => !existing.has(loc)).map(loc => `<url><loc>${loc}</loc></url>`).join("");
  if (additions) xml = xml.replace("</urlset>", `${additions}</urlset>`);

  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
