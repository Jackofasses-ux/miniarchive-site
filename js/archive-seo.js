/**
 * Mini Archive — shared SEO helpers for public Archive Records.
 *
 * This module is intentionally framework-free. It can be loaded by any
 * record template and turns record data into deterministic page metadata.
 * No per-record HTML files are required.
 */

(function (window) {
  'use strict';

  const SITE_URL = 'https://miniarchive.net';
  const DEFAULT_TITLE = 'Mini Archive — Digital Miniature Archive';
  const DEFAULT_DESCRIPTION = 'Archive, preserve, and share the history of painted miniatures.';

  function text(value) {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  function escapeHtml(value) {
    return text(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function first(...values) {
    return values.map(text).find(Boolean) || '';
  }

  function buildRecordSEO(record, options = {}) {
    const id = first(record?.archive_id, record?.archiveId, record?.id);
    const name = first(record?.name, record?.title, record?.model_name) || 'Miniature';
    const painter = first(record?.painter_name, record?.painterName, record?.artist_name, record?.artistName);
    const manufacturer = first(record?.manufacturer, record?.manufacturer_name);
    const game = first(record?.game, record?.game_name);
    const faction = first(record?.faction, record?.faction_name);
    const description = first(record?.description, record?.short_description);

    const qualifiers = [manufacturer, game, faction].filter(Boolean).join(' · ');
    const titleParts = [name, qualifiers].filter(Boolean);
    const title = `${titleParts.join(' — ')} | Mini Archive`;

    const descriptionParts = [
      name,
      painter ? `painted by ${painter}` : '',
      manufacturer,
      game,
      faction,
      description
    ].filter(Boolean);

    let metaDescription = descriptionParts.join(' · ');
    if (!metaDescription) metaDescription = DEFAULT_DESCRIPTION;
    metaDescription = metaDescription.slice(0, 160);

    // Keep the current record URL format until URL architecture is explicitly
    // migrated. This lets SEO improve without forcing a URL migration first.
    const recordUrl = options.url || `${SITE_URL}/record.html?id=${encodeURIComponent(id)}`;

    return {
      title,
      description: metaDescription,
      canonical: recordUrl,
      archiveId: id,
      name,
      image: first(record?.hero_image, record?.heroImage, record?.image, record?.cover_image),
      url: recordUrl,
      siteUrl: SITE_URL,
      defaultTitle: DEFAULT_TITLE
    };
  }

  function setMeta(selector, content, attribute = 'content') {
    if (!content) return;
    let node = document.head.querySelector(selector);
    if (!node) {
      node = document.createElement('meta');
      const match = selector.match(/^meta\[([^=]+)=["']?([^\]"']+)["']?\]$/);
      if (!match) return;
      node.setAttribute(match[1], match[2]);
      document.head.appendChild(node);
    }
    node.setAttribute(attribute, content);
  }

  function setCanonical(url) {
    if (!url) return;
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = url;
  }

  function apply(record, options = {}) {
    const seo = buildRecordSEO(record, options);
    document.title = seo.title || DEFAULT_TITLE;
    setMeta('meta[name="description"]', seo.description);
    setCanonical(seo.canonical);

    setMeta('meta[property="og:type"]', 'article');
    setMeta('meta[property="og:title"]', seo.title);
    setMeta('meta[property="og:description"]', seo.description);
    setMeta('meta[property="og:url"]', seo.url);
    if (seo.image) setMeta('meta[property="og:image"]', seo.image);

    setMeta('meta[name="twitter:card"]', seo.image ? 'summary_large_image' : 'summary');
    setMeta('meta[name="twitter:title"]', seo.title);
    setMeta('meta[name="twitter:description"]', seo.description);
    if (seo.image) setMeta('meta[name="twitter:image"]', seo.image);

    return seo;
  }

  window.MiniArchiveSEO = Object.freeze({
    escapeHtml,
    buildRecordSEO,
    apply
  });
})(window);
