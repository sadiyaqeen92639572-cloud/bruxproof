const fs = require('fs');
const DOMAIN = 'https://bruxproof.com';
const reviews = require('./data/reviews.json');
const guides = require('./data/guides.json');

const staticPaths = ['/', '/about/', '/how-we-test/', '/disclosure/', '/privacy/', '/changelog/'];
const reviewPaths = reviews.filter(r => r.status === 'published').map(r => `/${r.slug}/`);
const guidePaths = guides.filter(g => g.status === 'published').map(g => `/${g.slug}/`);

const paths = [...staticPaths, ...reviewPaths, ...guidePaths];

const today = new Date().toISOString().slice(0, 10);
const existing = paths.filter(p => fs.existsSync('.' + p + (p === '/' ? 'index.html' : 'index.html')));

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${existing.map(p => `  <url><loc>${DOMAIN}${p}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`;
fs.writeFileSync('sitemap.xml', xml);
console.log(`sitemap.xml written with ${existing.length} URLs`);
