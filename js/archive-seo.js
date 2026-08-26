/** Mini Archive — shared SEO helpers for public Archive Records. */
(function (window) {
  'use strict';
  const SITE_URL = 'https://miniarchive.net';
  const DEFAULT_TITLE = 'Mini Archive — Digital Miniature Archive';
  const DEFAULT_DESCRIPTION = 'Archive, preserve, and share the history of painted miniatures.';
  function text(value){ return value == null ? '' : String(value).trim(); }
  function escapeHtml(value){ return text(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
  function first(...values){ return values.map(text).find(Boolean) || ''; }
  function recordPath(id){ return id ? `/record/${encodeURIComponent(id)}` : '/archive.html'; }
  function recordUrl(id){ return `${SITE_URL}${recordPath(id)}`; }
  function buildRecordSEO(record, options = {}){
    const id=first(record?.archive_id,record?.archiveId,record?.id);
    const name=first(record?.name,record?.title,record?.model_name)||'Miniature';
    const painter=first(record?.painter_name,record?.painterName,record?.artist_name,record?.artistName);
    const manufacturer=first(record?.manufacturer,record?.manufacturer_name);
    const game=first(record?.game,record?.game_name);
    const faction=first(record?.faction,record?.faction_name);
    const description=first(record?.description,record?.short_description);
    const image=first(record?.hero_image,record?.heroImage,record?.image,record?.cover_image);
    const qualifiers=[manufacturer,game,faction].filter(Boolean).join(' · ');
    const title=[name,qualifiers].filter(Boolean).join(' — ')+' | Mini Archive';
    const parts=[name,painter?`painted by ${painter}`:'',manufacturer,game,faction,description].filter(Boolean);
    const metaDescription=(parts.join(' · ')||DEFAULT_DESCRIPTION).slice(0,160);
    const canonical=options.url||recordUrl(id);
    return {title,description:metaDescription,canonical,archiveId:id,name,painter,manufacturer,game,faction,image,url:canonical,siteUrl:SITE_URL,defaultTitle:DEFAULT_TITLE};
  }
  function setMeta(selector,content,attribute='content'){
    if(!content)return;
    let node=document.head.querySelector(selector);
    if(!node){ node=document.createElement('meta'); const match=selector.match(/^meta\[([^=]+)=["']?([^\]"']+)["']?\]$/); if(!match)return; node.setAttribute(match[1],match[2]); document.head.appendChild(node); }
    node.setAttribute(attribute,content);
  }
  function setCanonical(url){ if(!url)return; let link=document.head.querySelector('link[rel="canonical"]'); if(!link){link=document.createElement('link');link.rel='canonical';document.head.appendChild(link);} link.href=url; }
  function setStructuredData(seo){
    let node=document.head.querySelector('script[data-miniarchive-record-schema]');
    if(!node){ node=document.createElement('script'); node.type='application/ld+json'; node.dataset.miniarchiveRecordSchema=''; document.head.appendChild(node); }
    const schema={ '@context':'https://schema.org', '@type':'CreativeWork', name:seo.name, description:seo.description, url:seo.url, identifier:seo.archiveId, isPartOf:{'@type':'WebSite',name:'Mini Archive',url:SITE_URL} };
    if(seo.painter) schema.creator={'@type':'Person',name:seo.painter};
    if(seo.manufacturer) schema.brand={'@type':'Brand',name:seo.manufacturer};
    if(seo.game) schema.about=[{'@type':'Thing',name:seo.game}];
    if(seo.faction){ schema.about=schema.about||[]; schema.about.push({'@type':'Thing',name:seo.faction}); }
    if(seo.image) schema.image=seo.image;
    node.textContent=JSON.stringify(schema).replace(/</g,'\\u003c');
  }
  function apply(record,options={}){
    const seo=buildRecordSEO(record,options); document.title=seo.title||DEFAULT_TITLE; setMeta('meta[name="description"]',seo.description); setCanonical(seo.canonical);
    setMeta('meta[property="og:type"]','article'); setMeta('meta[property="og:site_name"]','Mini Archive'); setMeta('meta[property="og:title"]',seo.title); setMeta('meta[property="og:description"]',seo.description); setMeta('meta[property="og:url"]',seo.url); if(seo.image)setMeta('meta[property="og:image"]',seo.image);
    setMeta('meta[name="twitter:card"]',seo.image?'summary_large_image':'summary'); setMeta('meta[name="twitter:title"]',seo.title); setMeta('meta[name="twitter:description"]',seo.description); if(seo.image)setMeta('meta[name="twitter:image"]',seo.image);
    setStructuredData(seo);
    return seo;
  }
  window.MiniArchiveSEO=Object.freeze({escapeHtml,recordPath,recordUrl,buildRecordSEO,apply});
})(window);
