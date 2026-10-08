import { chapters } from '../data/curriculum';
import { guidePath } from '../data/chapter-guides';

export function GET({ site }) {
  const urls = ['/', ...chapters.map(chapter => guidePath(chapter.id))];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(path => `<url><loc>${new URL(path, site).href}</loc></url>`).join('')}</urlset>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
