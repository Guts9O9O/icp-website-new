import { useEffect } from 'react';

const SITE_NAME = 'iConcepts + Partners';
const DEFAULT_DESCRIPTION =
  'iConcepts + Partners (iC+P) is a Mumbai-based interior design studio founded in 2007, designing hospitality, commercial, developer and private residential spaces. Design to live.';

function setMeta(selector, attr, value) {
  let el = document.head.querySelector(selector);
  if (!value) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement(selector.startsWith('link') ? 'link' : 'meta');
    const [, key, name] = selector.match(/\[(\w+)="([^"]+)"\]/);
    el.setAttribute(key, name);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

/**
 * Sets the document title, description, canonical URL and share-preview tags
 * for the current page. Search engines that run JavaScript (Google) pick these
 * up per page; the static tags in index.html cover everything else.
 */
export function useSeo({ title, description, image, noindex = false } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Interior Design Studio, Mumbai`;
    const desc = (description || DEFAULT_DESCRIPTION).replace(/\s+/g, ' ').trim().slice(0, 160);
    const url = `${window.location.origin}${window.location.pathname}`;

    document.title = fullTitle;
    setMeta('meta[name="description"]', 'content', desc);
    setMeta('meta[property="og:title"]', 'content', fullTitle);
    setMeta('meta[property="og:description"]', 'content', desc);
    setMeta('meta[property="og:url"]', 'content', url);
    setMeta('meta[property="og:image"]', 'content', image || `${window.location.origin}/og-image.jpg`);
    setMeta('link[rel="canonical"]', 'href', url);
    setMeta('meta[name="robots"]', 'content', noindex ? 'noindex, nofollow' : '');
  }, [title, description, image, noindex]);
}
