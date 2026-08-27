const SITE_URL = "https://miniarchive.net";
const SUPABASE_URL = "https://oesjjvrofwlhcxilwaen.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lc2pqdnJvZndsaGN4aWx3YWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3Mzg5MDEsImV4cCI6MjEwMDMxNDkwMX0.Tazlir8gkSk8Y-aQMFOjmgadCgOhyaTfV8p8dWi9thw";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/sitemap.xml") return serveSitemap(env);

    if (request.method === "GET" && url.pathname === "/record.html" && url.searchParams.get("id")) {
      return Response.redirect(recordUrl(url.searchParams.get("id")), 308);
    }
    const recordMatch = request.method === "GET" && url.pathname.match(/^\/archive\/([^/]+)\/?$/);
    if (recordMatch) {
      return serveRecordWithMetadata(request, env, decodeURIComponent(recordMatch[1]));
    }
    if (request.method === "GET" && url.pathname === "/profile.html" && url.searchParams.get("username")) {
      const response = await serveProfileWithMetadata(request, env, url.searchParams.get("username"));
      return addCardLinkEnhancer(response);
    }

    const assetResponse = await env.ASSETS.fetch(request);
    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html" || url.pathname === "/archive.html")) {
      return addCardLinkEnhancer(assetResponse);
    }
    return assetResponse;
  },
};

function addCardLinkEnhancer(response) {
  if (!response.ok || !isHtml(response)) return response;
  return new HTMLRewriter()
    .on("head", { element(element) { element.append('<script src="/js/crawlable-cards.js" defer></script>', { html: true }); } })
    .transform(response);
}

async function serveRecordWithMetadata(request, env, archiveId) {
  const assetUrl = new URL("/record.html", request.url);
  const assetResponse = await env.ASSETS.fetch(new Request(assetUrl, request));
  if (!assetResponse.ok || !isHtml(assetResponse)) return assetResponse;
  try {
    const select = "archive_id,title,manufacturer,description,completed_at,painter_name,painter_profile:profiles!painter_profile_id(username,display_name),photos(image_url,photo_type)";
    const endpoint = `${SUPABASE_URL}/rest/v1/miniatures?select=${encodeURIComponent(select)}&archive_id=eq.${encodeURIComponent(archiveId)}&visibility=eq.public&status=eq.completed&limit=1`;
    const rows = await supabaseGet(endpoint);
    const record = rows?.[0];
    if (!record) return noindexNotFound(assetResponse);
    const canonical = recordUrl(record.archive_id);
    if (new URL(request.url).pathname !== new URL(canonical).pathname) return Response.redirect(canonical, 308);
    const painter = record.painter_name || record.painter_profile?.display_name || record.painter_profile?.username || "";
    const title = `${record.title}${record.manufacturer ? ` — ${record.manufacturer}` : ""} | Mini Archive`;
    const description = buildDescription([record.title, painter ? `painted by ${painter}` : "", record.manufacturer, record.description]);
    const image = chooseImage(record.photos || []);
    const profileUrl = record.painter_profile?.username ? `${SITE_URL}/profile.html?username=${encodeURIComponent(record.painter_profile.username)}` : null;
    const work = { "@context":"https://schema.org", "@type":"CreativeWork", name:record.title, description, url:canonical, identifier:record.archive_id, isPartOf:{"@type":"WebSite",name:"Mini Archive",url:SITE_URL} };
    if (record.manufacturer) work.brand = { "@type":"Brand", name:record.manufacturer };
    if (painter) work.creator = profileUrl ? { "@type":"Person", name:painter, url:profileUrl } : { "@type":"Person", name:painter };
    if (record.completed_at) work.dateCreated = record.completed_at;
    if (image) work.image = image;
    const breadcrumb = { "@context":"https://schema.org", "@type":"BreadcrumbList", itemListElement:[
      {"@type":"ListItem",position:1,name:"Mini Archive",item:SITE_URL},
      {"@type":"ListItem",position:2,name:"Archive",item:`${SITE_URL}/archive.html`},
      {"@type":"ListItem",position:3,name:record.title,item:canonical}
    ]};
    return enrichRecordHtml(assetResponse, buildHeadMetadata({ title, description, canonical, image, type:"article", schemas:[work,breadcrumb] }), buildRecordSummary(record, painter, image));
  } catch (error) { console.error("Record SEO enrichment failed:", error); return temporaryNoindex(assetResponse); }
}

async function serveProfileWithMetadata(request, env, username) {
  const assetResponse = await env.ASSETS.fetch(request);
  if (!assetResponse.ok || !isHtml(assetResponse)) return assetResponse;
  try {
    const endpoint = `${SUPABASE_URL}/rest/v1/profiles?select=${encodeURIComponent("id,username,display_name,bio,country,avatar_url")}&username=eq.${encodeURIComponent(username)}&limit=1`;
    const rows = await supabaseGet(endpoint);
    const profile = rows?.[0];
    if (!profile) return assetResponse;
    const miniSelect = "archive_id,title,manufacturer,created_at,photos(image_url,photo_type)";
    const ownedEndpoint = `${SUPABASE_URL}/rest/v1/miniatures?select=${encodeURIComponent(miniSelect)}&owner_profile_id=eq.${encodeURIComponent(profile.id)}&visibility=eq.public&status=eq.completed&order=created_at.desc&limit=50`;
    const paintedEndpoint = `${SUPABASE_URL}/rest/v1/miniatures?select=${encodeURIComponent(miniSelect)}&painter_profile_id=eq.${encodeURIComponent(profile.id)}&visibility=eq.public&status=eq.completed&order=created_at.desc&limit=50`;
    const [owned, painted] = await Promise.all([supabaseGet(ownedEndpoint), supabaseGet(paintedEndpoint)]);
    const byId = new Map();
    [...(owned || []), ...(painted || [])].forEach(mini => byId.set(mini.archive_id, mini));
    const minis = [...byId.values()];
    if (!minis.length) return assetResponse;
    const name = profile.display_name || profile.username;
    const canonical = `${SITE_URL}/profile.html?username=${encodeURIComponent(profile.username)}`;
    const description = buildDescription([`${name} on Mini Archive`, profile.bio, profile.country, `${minis.length} public miniature${minis.length === 1 ? "" : "s"}`]);
    const title = `${name} (@${profile.username}) | Mini Archive`;
    const person = { "@context":"https://schema.org", "@type":"Person", name, alternateName:`@${profile.username}`, url:canonical, description };
    if (profile.avatar_url) person.image = profile.avatar_url;
    const itemList = { "@context":"https://schema.org", "@type":"ItemList", name:`${name} — public miniature records`, numberOfItems:minis.length, itemListElement:minis.slice(0,50).map((mini,index)=>({"@type":"ListItem",position:index+1,name:mini.title,url:recordUrl(mini.archive_id)})) };
    return enrichHtml(assetResponse, buildHeadMetadata({ title, description, canonical, image:profile.avatar_url, type:"profile", schemas:[person,itemList] }));
  } catch (error) { console.error("Profile SEO enrichment failed:", error); return assetResponse; }
}

async function supabaseGet(endpoint) {
  const response = await fetch(endpoint, { headers:{ apikey:SUPABASE_ANON_KEY, Authorization:`Bearer ${SUPABASE_ANON_KEY}` } });
  if (!response.ok) throw new Error(`Supabase metadata request failed: ${response.status}`);
  return response.json();
}
function isHtml(response){ return (response.headers.get("content-type") || "").includes("text/html"); }
function enrichHtml(assetResponse, metadata){ return new HTMLRewriter().on("title",{element(e){e.setInnerContent(metadata.title);}}).on("head",{element(e){e.append(metadata.head,{html:true});}}).transform(assetResponse); }
function enrichRecordHtml(assetResponse, metadata, summary){ return new HTMLRewriter().on("title",{element(e){e.setInnerContent(metadata.title);}}).on("head",{element(e){e.append(metadata.head,{html:true});}}).on("main",{element(e){e.prepend(summary,{html:true});}}).transform(assetResponse); }
function buildHeadMetadata({title,description,canonical,image,type,schemas}){
  const tags=[`<meta name="description" content="${escapeAttribute(description)}">`,`<link rel="canonical" href="${escapeAttribute(canonical)}">`,`<meta property="og:type" content="${escapeAttribute(type)}">`,`<meta property="og:site_name" content="Mini Archive">`,`<meta property="og:title" content="${escapeAttribute(title)}">`,`<meta property="og:description" content="${escapeAttribute(description)}">`,`<meta property="og:url" content="${escapeAttribute(canonical)}">`,image?`<meta property="og:image" content="${escapeAttribute(image)}">`:"",`<meta name="twitter:card" content="${image?"summary_large_image":"summary"}">`,`<meta name="twitter:title" content="${escapeAttribute(title)}">`,`<meta name="twitter:description" content="${escapeAttribute(description)}">`,image?`<meta name="twitter:image" content="${escapeAttribute(image)}">`:"",...(schemas||[]).map(schema=>`<script type="application/ld+json">${safeJson(schema)}</script>` )];
  return {title,head:tags.filter(Boolean).join("\n")};
}
function buildDescription(parts){ return parts.filter(Boolean).join(" · ").replace(/\s+/g," ").slice(0,160); }
function chooseImage(photos){ return (photos.find(photo=>photo.photo_type==="front")||photos[0])?.image_url||null; }
function escapeAttribute(value){ return String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;").replace(/\n/g," "); }
function escapeXml(value){ return String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;"); }
function safeJson(value){ return JSON.stringify(value).replace(/</g,"\\u003c"); }
function recordUrl(archiveId){ return `${SITE_URL}/archive/${encodeURIComponent(archiveId)}`; }
function buildRecordSummary(record,painter,image){
  const details=[record.manufacturer,painter?`Painted by ${painter}`:"",record.completed_at?`Completed ${String(record.completed_at).slice(0,10)}`:""].filter(Boolean);
  return `<article id="server-record-summary" data-record-summary><h1>${escapeHtml(record.title)}</h1>${image?`<img src="${escapeAttribute(image)}" alt="${escapeAttribute(record.title)} painted miniature">`:""}${details.length?`<p>${details.map(escapeHtml).join(" · ")}</p>`:""}${record.description?`<p>${escapeHtml(record.description)}</p>`:""}<p><a href="/archive.html">Browse the Mini Archive</a></p></article>`;
}
function noindexNotFound(response){
  return new HTMLRewriter().on("head",{element(e){e.append('<meta name="robots" content="noindex, nofollow">',{html:true});}}).transform(new Response(response.body,{status:404,headers:response.headers}));
}
function temporaryNoindex(response){
  return new HTMLRewriter().on("head",{element(e){e.append('<meta name="robots" content="noindex, nofollow">',{html:true});}}).transform(new Response(response.body,{status:503,headers:response.headers}));
}
function escapeHtml(value){ return String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }

async function serveSitemap(env) {
  try {
    const recordSelect="archive_id,updated_at,owner_profile_id,painter_profile_id";
    const recordEndpoint=`${SUPABASE_URL}/rest/v1/miniatures?select=${encodeURIComponent(recordSelect)}&visibility=eq.public&status=eq.completed&archive_id=not.is.null&order=updated_at.desc&limit=5000`;
    const records=await supabaseGet(recordEndpoint);
    const profileIds=[...new Set((records||[]).flatMap(record=>[record.owner_profile_id,record.painter_profile_id]).filter(Boolean))];
    let profiles=[];
    if(profileIds.length){ const idFilter=`(${profileIds.map(id=>`\"${id}\"`).join(",")})`; const profileEndpoint=`${SUPABASE_URL}/rest/v1/profiles?select=id,username&id=in.${encodeURIComponent(idFilter)}&username=not.is.null&limit=5000`; profiles=await supabaseGet(profileEndpoint); }
    const urls=new Map();
    const addUrl=(loc,lastmod="")=>{ if(!loc||urls.has(loc))return; urls.set(loc,lastmod?String(lastmod).slice(0,10):""); };
    addUrl(`${SITE_URL}/`); addUrl(`${SITE_URL}/archive.html`); addUrl(`${SITE_URL}/features.html`); addUrl(`${SITE_URL}/about.html`);
    for(const record of records||[]) addUrl(recordUrl(record.archive_id),record.updated_at);
    for(const profile of profiles||[]) if(profile.username) addUrl(`${SITE_URL}/profile.html?username=${encodeURIComponent(profile.username)}`);
    const body=[...urls.entries()].map(([loc,lastmod])=>`  <url><loc>${escapeXml(loc)}</loc>${lastmod?`<lastmod>${escapeXml(lastmod)}</lastmod>`:""}</url>`).join("\n");
    const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
    return new Response(xml,{headers:{"Content-Type":"application/xml; charset=utf-8","Cache-Control":"public, max-age=3600, s-maxage=3600"}});
  } catch(error){
    console.error("Dynamic sitemap generation failed:",error);
    const cached=await env.SITEMAP_CACHE.get("sitemap.xml");
    if(cached){
      const normalized=cached
        .replaceAll("https://www.miniarchive.net",SITE_URL)
        .replace(/https:\/\/miniarchive\.net\/record\.html\?id=([A-Za-z0-9_-]+)/g,(_,id)=>recordUrl(id));
      return new Response(normalized,{headers:{"Content-Type":"application/xml; charset=utf-8","Cache-Control":"public, max-age=300"}});
    }
    return new Response("Sitemap temporarily unavailable",{status:503});
  }
}
