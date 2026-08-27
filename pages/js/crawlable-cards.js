// Mini Archive — progressively enhance JS-rendered model cards with real links.
// Existing onclick behaviour is left intact as a fallback; this only adds a
// semantic anchor so keyboard users and crawlers can follow the same target.
(function () {
  'use strict';

  function targetFromCard(card) {
    const handler = card.getAttribute('onclick') || '';
    const match = handler.match(/window\.location\.href\s*=\s*['"]([^'"]+)['"]/);
    return match ? match[1] : '';
  }

  function enhanceCard(card) {
    if (!card || card.dataset.crawlableLink === 'true') return;
    const href = targetFromCard(card);
    if (!href) return;

    const title = card.querySelector('.name')?.textContent?.trim() ||
      card.querySelector('img')?.getAttribute('alt') ||
      card.querySelector('.id-tag')?.textContent?.trim() ||
      'View miniature record';

    const link = document.createElement('a');
    link.href = href;
    link.className = 'card-record-link';
    link.setAttribute('aria-label', title);
    link.style.position = 'absolute';
    link.style.inset = '0';
    link.style.zIndex = '2';
    link.style.display = 'block';

    if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
    card.appendChild(link);
    card.dataset.crawlableLink = 'true';

    // Keep edit controls above the full-card link.
    card.querySelectorAll('.card-edit-link').forEach((edit) => {
      edit.style.position = edit.style.position || 'absolute';
      edit.style.zIndex = '5';
    });
  }

  function enhance(root) {
    if (root.nodeType === 1 && root.matches?.('.mini-card')) enhanceCard(root);
    root.querySelectorAll?.('.mini-card').forEach(enhanceCard);
  }

  enhance(document);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) enhance(node);
      });
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
