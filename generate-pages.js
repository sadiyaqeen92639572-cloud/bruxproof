const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://bruxproof.com';
const YEAR = new Date().getFullYear();
const LAST_REVIEWED = '2026-08-28';
const AUTHOR_NAME = 'BruxProof Editorial Team';
const GSC_TAG = 'xps_FuwGDIwW5LJuoF0Ax8xLzLnJhpaX6SeGCdf6YIo';
const AMAZON_TAG = 'bruxproof-20'; // TODO: Replace with real Amazon Associates tag
const ORG = {
  '@type': 'Organization',
  name: 'BruxProof',
  legalName: 'Gesmine-Invest Limited',
  url: DOMAIN,
  identifier: { '@type': 'PropertyValue', propertyID: 'UK Company Number', value: '14120136' },
  address: { '@type': 'PostalAddress', streetAddress: 'Hardy House, 269 Poynders Gardens', addressLocality: 'London', postalCode: 'SW4 8PQ', addressCountry: 'GB' }
};

const products = require('./data/products.json');
const reviews  = require('./data/reviews.json');
const guides   = require('./data/guides.json');

// ─── Layout ──────────────────────────────────────────────────────────────────
function layout({ title, description, canonicalPath, h1, subtitle, jsonLd, bodyHtml, noindex = false }) {
  const canonical   = `${DOMAIN}${canonicalPath}`;
  const noindexTag  = noindex ? '\n<meta name="robots" content="noindex">' : '';
  const gscTag      = GSC_TAG ? `\n<meta name="google-site-verification" content="${GSC_TAG}" />` : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${canonical}">${noindexTag}
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${DOMAIN}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${DOMAIN}/og-image.png">${gscTag}
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="stylesheet" href="/assets/styles.css">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
<div class="disclosure-banner">⚠️ <strong>Affiliate Disclosure:</strong> Some links on this page are affiliate links — if you buy through them we may earn a small commission at no extra cost to you. This never influences which products we recommend. We purchase every product with our own money. <a href="/disclosure/">Full disclosure →</a></div>
<header>
<a href="/" class="site-logo">BruxProof</a>
<nav class="header-nav">
  <a href="/best-night-guard-for-teeth-grinding/">Night Guards</a>
  <a href="/custom-night-guard-for-teeth-grinding/">Custom Guards</a>
  <a href="/best-boil-and-bite-night-guard/">Boil & Bite</a>
  <a href="/how-to-stop-grinding-teeth-in-your-sleep/">Guides</a>
</nav>
</header>
<main>
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / ${h1}</nav>
<h1>${h1}</h1>
${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
${bodyHtml}
</main>
<footer>
<p>BruxProof is published by <strong>Gesmine-Invest Limited</strong>, registered UK company number 14120136, Hardy House, 269 Poynders Gardens, London SW4 8PQ, United Kingdom.</p>
<p><a href="/about/">About</a> · <a href="/how-we-test/">How We Test</a> · <a href="/disclosure/">Disclosure</a> · <a href="/privacy/">Privacy</a> · <a href="/changelog/">Changelog</a> · © ${YEAR} BruxProof.</p>
<p class="footer-disclaimer">Content on this site is for informational purposes only and is not a substitute for professional medical advice. If jaw pain persists, please consult a licensed dentist or healthcare provider.</p>
</footer>
</body>
</html>
`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function faqJsonLd(items) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a }
    }))
  };
}

function write(dir, html) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log('wrote', dir);
}

// ─── Build Guards ─────────────────────────────────────────────────────────────
function assertReviewPublishable(review) {
  if (review.status === 'published') {
    if (!review.last_tested)
      throw new Error(`BUILD BLOCKED: Review "${review.slug}" is published but has no last_tested date.`);
    for (const pSlug of review.product_slugs) {
      const prod = products.find(p => p.slug === pSlug);
      if (!prod)
        throw new Error(`BUILD BLOCKED: Review "${review.slug}" references missing product "${pSlug}".`);
      if (prod.status !== 'tested')
        throw new Error(`BUILD BLOCKED: Review "${review.slug}" is published but product "${pSlug}" has status "${prod.status}" (need "tested").`);
    }
  }
}

function assertGuideCited(guide) {
  if (guide.status === 'published') {
    if (!guide.citations || guide.citations.length === 0)
      throw new Error(`BUILD BLOCKED: Guide "${guide.slug}" is published but has no citations.`);
    for (const cit of guide.citations) {
      if (!cit.url || !cit.year)
        throw new Error(`BUILD BLOCKED: Guide "${guide.slug}" has a citation missing url or year.`);
    }
  }
}

// ─── Money Pages (Reviews) ────────────────────────────────────────────────────
// Intro paragraphs keyed by slug — primary keyword used naturally in first sentence
const reviewIntros = {
  'best-night-guard-for-teeth-grinding': `<p class="review-intro">Finding the <strong>best night guard for teeth grinding</strong> can save your enamel and eliminate morning jaw pain, but the wrong guard can actually make bruxism worse. We spent months measuring the thickness loss of top custom and OTC guards with digital calipers to find out which ones actually last.</p><p class="review-meta"><em>Last tested: August 2026 · Products bought with our own money · <a href="/how-we-test/">How we test →</a></em></p>`,

  'best-night-guard-for-tmj': `<p class="review-intro">The <strong>best night guard for TMJ</strong> must do more than just protect teeth—it needs to actively offload pressure from the temporomandibular joint. We tested both anterior-only and full-arch designs over 30 nights to document fit retention and comfort for severe jaw pain sufferers.</p><p class="review-meta"><em>Last tested: August 2026 · <a href="/how-we-test/">How we test →</a></em></p>`,

  'custom-night-guard-for-teeth-grinding': `<p class="review-intro">Ordering a <strong>custom night guard for teeth grinding</strong> online is significantly cheaper than going through a dentist, but how do the D2C brands stack up? We ordered from Pro Teeth Guard, Remi, and JS Dental Lab, took our own impressions, and wear-tested the final products to objectively measure durability and fit.</p><p class="review-meta"><em>Last tested: August 2026 · <a href="/how-we-test/">How we test →</a></em></p>`,

  'best-boil-and-bite-night-guard': `<p class="review-intro">The <strong>best boil and bite night guard</strong> provides an immediate, affordable solution to bruxism before investing in a custom lab-made piece. We tested the top OTC brands from the pharmacy to evaluate moldability, bulkiness, and how long they take to wear through.</p><p class="review-meta"><em>Last tested: August 2026 · <a href="/how-we-test/">How we test →</a></em></p>`,

  'thinnest-night-guard': `<p class="review-intro">If you hate sleeping with a bulky piece of plastic in your mouth, finding the <strong>thinnest night guard</strong> is essential for compliance. Using digital calipers, we measured the precise millimeter thickness of the leading guards—and tested them to ensure they won't crack under heavy grinding pressure despite their slim profile.</p><p class="review-meta"><em>Last tested: August 2026 · <a href="/how-we-test/">How we test →</a></em></p>`,

  'oral-b-nighttime-dental-guard-review': `<p class="review-intro">This <strong>Oral B night guard review</strong> covers the Oral-B Nighttime Dental Guard: we put one of the most popular pharmacy brands through a strict 30-night wear test, measuring exact thickness loss and tracking fit retention to see if it's worth the price.</p><p class="review-meta"><em>Last tested: August 2026 · <a href="/how-we-test/">How we test →</a></em></p>`,

  'pro-teeth-guard-review': `<p class="review-intro">Our objective <strong>Pro Teeth Guard review</strong> covers the full process: from the at-home impression kit to a 30-night destructive test of the final hard acrylic guard. Here is the caliper data on how well it survives heavy bruxism.</p><p class="review-meta"><em>Last tested: August 2026 · <a href="/how-we-test/">How we test →</a></em></p>`,

  'remi-night-guard-review': `<p class="review-intro">This <strong>Remi night guard review</strong> cuts through the marketing to look at hard numbers. We measured the exact thickness (which differed from advertised specs) and tracked the wear rate over 30 nights of use.</p><p class="review-meta"><em>Last tested: August 2026 · <a href="/how-we-test/">How we test →</a></em></p>`
};

// Contextual money-page → informational-guide links (reverse of guideToReview)
const reviewToGuides = {
  'best-night-guard-for-teeth-grinding':   ['what-causes-bruxism', 'how-to-stop-grinding-teeth-in-your-sleep', 'how-long-do-night-guards-last'],
  'best-night-guard-for-tmj':              ['night-guard-making-jaw-hurt', 'soft-vs-hard-night-guard'],
  'custom-night-guard-for-teeth-grinding': ['soft-vs-hard-night-guard', 'how-long-do-night-guards-last'],
  'best-boil-and-bite-night-guard':        ['how-to-clean-a-night-guard', 'night-guard-making-jaw-hurt'],
  'thinnest-night-guard':                  ['soft-vs-hard-night-guard', 'night-guard-vs-mouthguard'],
  'oral-b-nighttime-dental-guard-review':  ['how-to-clean-a-night-guard', 'how-long-do-night-guards-last'],
  'pro-teeth-guard-review':               ['soft-vs-hard-night-guard', 'how-long-do-night-guards-last'],
  'remi-night-guard-review':              ['how-long-do-night-guards-last', 'how-to-clean-a-night-guard'],
};

for (const review of reviews) {
  assertReviewPublishable(review);
  const isPublished = review.status === 'published';
  const title       = isPublished ? review.title_tested : review.title_neutral;

  let body = '';

  if (!isPublished) {
    body += `<div class="review-in-progress">
  <strong>⏳ Review in progress</strong> — We are currently wear-testing products for this category. Check back soon for measured data and verdicts. <a href="/how-we-test/">See our testing protocol →</a>
</div>`;
  } else {
    // Methodology inline block
    body += `<div class="methodology-block">
  <strong>📋 Testing methodology:</strong> Each product was worn for a minimum of <strong>${review.product_slugs.map(s => products.find(p => p.slug === s)).filter(Boolean).reduce((max, p) => Math.max(max, p.nights_tested), 0)} nights</strong>. Thickness was measured before and after with 3-point digital calipers to calculate exact material loss %. All products purchased with our own money. Last tested: <strong>${review.last_tested}</strong>. <a href="/how-we-test/">Full protocol →</a>
</div>`;
    // Keyword-rich intro paragraph
    body += reviewIntros[review.slug] || '';

    for (const pSlug of review.product_slugs) {
      const p = products.find(prod => prod.slug === pSlug);
      if (!p) throw new Error(`Missing product data for slug: ${pSlug}`);

      // aggregateRating only if rating data exists
      const ratingSchema = p.rating_value && p.rating_count ? `
        <div class="product-rating">⭐ ${p.rating_value}/5 <span>(${p.rating_count} reviews)</span></div>` : '';

      body += `
      <section class="product-card" id="${p.slug}">
        <h2>${p.name}</h2>
        ${ratingSchema}
        <p class="verified-badge">✓ Wear-tested ${p.nights_tested} nights with digital calipers — see our <a href="/how-we-test/">testing protocol</a></p>
        <table class="spec-table">
          <thead><tr><th>Spec</th><th>Measured</th></tr></thead>
          <tbody>
          <tr><td>Fabrication</td><td>${p.fabrication}</td></tr>
          <tr><td>Material</td><td>${p.material || 'N/A'}</td></tr>
          <tr><td>Price (RRP)</td><td>$${p.price_retail_usd}</td></tr>
          <tr><td>Thickness (initial)</td><td>${p.thickness_mm != null ? p.thickness_mm.toFixed(2) + ' mm' : 'N/A'}</td></tr>
          <tr><td>Durometer (Shore A)</td><td>${p.durometer_shore_a != null ? p.durometer_shore_a : 'N/A'}</td></tr>
          <tr><td>Nights Tested</td><td>${p.nights_tested} nights</td></tr>
          <tr><td>Thickness Loss</td><td>${p.thickness_loss_pct != null ? '<strong>' + p.thickness_loss_pct + '%</strong>' : 'N/A'}</td></tr>
          <tr><td>Fit Retention</td><td>${p.fit_retention}</td></tr>
          <tr><td>Moldability Score</td><td>${p.moldability_score != null ? p.moldability_score + '/5' : 'N/A (lab-custom)'}</td></tr>
          <tr><td>Bite-Through Observed</td><td>${p.bite_through ? '<strong style="color:red">Yes ⚠️</strong>' : 'No ✓'}</td></tr>
          </tbody>
        </table>
        <div class="review-verdict"><strong>Our Verdict:</strong> ${p.verdict}</div>
        <div class="pros-cons">
          <div class="pros"><h3>✅ Pros</h3><ul>${p.pros.map(pro => `<li>${pro}</li>`).join('')}</ul></div>
          <div class="cons"><h3>❌ Cons</h3><ul>${p.cons.map(con => `<li>${con}</li>`).join('')}</ul></div>
        </div>
        ${p.affiliate_url ? `<p><a href="${p.affiliate_url}" class="buy-btn" rel="sponsored noopener" target="_blank">Check Price on Official Site →</a></p>` : ''}
        ${p.amazon_asin ? `<p><a href="https://www.amazon.com/dp/${p.amazon_asin}?tag=${AMAZON_TAG}" class="buy-btn secondary-btn" rel="sponsored noopener" target="_blank">Check Price on Amazon →</a></p>` : ''}
      </section>`;
    }
  }

  // JSON-LD graph
  const graph = [];

  graph.push({
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: DOMAIN + '/' },
      { '@type': 'ListItem', position: 2, name: review.h1, item: DOMAIN + '/' + review.slug + '/' }
    ]
  });

  if (isPublished) {
    // ItemList schema listing each reviewed product
    if (review.product_slugs.length > 0) {
      graph.push({
        '@type': 'ItemList',
        name: review.h1,
        itemListElement: review.product_slugs.map((pSlug, i) => {
          const p = products.find(prod => prod.slug === pSlug);
          const item = {
            '@type': 'ListItem',
            position: i + 1,
            name: p.name,
            url: `${DOMAIN}/${review.slug}/#${p.slug}`
          };
          return item;
        })
      });

      // Product + AggregateRating only for single-product reviews (a real product entity).
      // Roundups stay ItemList-only — no synthetic aggregate rating for a non-product.
      if (review.product_slugs.length === 1) {
        const p = products.find(pr => pr.slug === review.product_slugs[0]);
        if (p && p.rating_value && p.rating_count) {
          graph.push({
            '@type': 'Product',
            name: p.name,
            brand: { '@type': 'Brand', name: p.brand },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: String(p.rating_value),
              ratingCount: p.rating_count,
              bestRating: '5',
              worstRating: '1'
            }
          });
        }
      }
    }

    // Article schema
    graph.push({
      '@type': 'Article',
      headline: title,
      author: { '@type': 'Person', name: AUTHOR_NAME },
      publisher: ORG,
      datePublished: review.last_tested,
      dateModified: review.last_updated
    });
  }

  if (review.faq && review.faq.length > 0) {
    graph.push(faqJsonLd(review.faq));
    // Append FAQ to body
    body += `<section class="faq-section"><h2>Frequently Asked Questions</h2>`;
    for (const [q, a] of review.faq) {
      body += `<details><summary>${q}</summary><p>${a}</p></details>`;
    }
    body += `</section>`;
  }

  // ── Related reviews cross-links (money page cluster linking) ──
  if (isPublished) {
    const otherReviews = reviews.filter(r => r.slug !== review.slug && r.status === 'published');
    if (otherReviews.length > 0) {
      body += `<section class="related-guides"><h2>More From Our Tests</h2><ul>`;
      for (const or_ of otherReviews.slice(0, 5)) {
        body += `<li><a href="/${or_.slug}/">${or_.h1}</a></li>`;
      }
      body += `</ul></section>`;
    }

    // ── Contextual links to informational guides ──
    const guideSlugs = (reviewToGuides[review.slug] || [])
      .map(gs => guides.find(g => g.slug === gs && g.status === 'published'))
      .filter(Boolean);
    if (guideSlugs.length > 0) {
      body += `<section class="related-guides"><h2>Related Guides</h2><ul>`;
      for (const g of guideSlugs) {
        body += `<li><a href="/${g.slug}/">${g.h1}</a></li>`;
      }
      body += `</ul></section>`;
    }
  }

  graph.push(ORG);

  const jsonLd = { '@context': 'https://schema.org', '@graph': graph };

  write(review.slug, layout({
    title,
    description: review.meta,
    canonicalPath: `/${review.slug}/`,
    h1: review.h1,
    jsonLd,
    bodyHtml: body,
    noindex: !isPublished
  }));
}

// ─── Informational Guide Pages ────────────────────────────────────────────────
for (const guide of guides) {
  assertGuideCited(guide);

  let body = '';
  for (const sec of guide.body_sections) {
    body += `<section><h2>${sec.h2}</h2>${sec.html}</section>`;
  }

  if (guide.citations && guide.citations.length > 0) {
    body += `<section class="references"><h2>References</h2><ol>`;
    for (const cit of guide.citations) {
      body += `<li>${cit.source} (${cit.year}). <em>${cit.claim}.</em> <a href="${cit.url}" target="_blank" rel="noopener noreferrer">PubMed / DOI ↗</a>${cit.n ? ` (n=${cit.n})` : ''}</li>`;
    }
    body += `</ol></section>`;
  }

  body += `<section class="medical-disclaimer"><p>⚕️ <strong>Medical disclaimer:</strong> This content is for informational purposes only and does not constitute medical advice. If your jaw pain persists, please consult a licensed dentist or healthcare provider.</p></section>`;

  // ── Related guides cross-links (horizontal cluster linking) ──
  const otherGuides = guides.filter(g => g.slug !== guide.slug && g.status === 'published');
  if (otherGuides.length > 0) {
    body += `<section class="related-guides">
  <h2>Related Guides</h2>
  <ul>`;
    for (const og of otherGuides) {
      body += `<li><a href="/${og.slug}/">${og.h1}</a></li>`;
    }
    body += `</ul>
</section>`;
  }

  // ── "From our tests" box — links to most relevant money page ──
  const guideToReview = {
    'how-long-do-night-guards-last':          { slug: 'best-night-guard-for-teeth-grinding', label: 'Best Night Guard for Teeth Grinding' },
    'how-to-stop-grinding-teeth-in-your-sleep': { slug: 'best-night-guard-for-teeth-grinding', label: 'Best Night Guard for Teeth Grinding' },
    'what-causes-bruxism':                    { slug: 'best-night-guard-for-teeth-grinding', label: 'Best Night Guard for Teeth Grinding' },
    'soft-vs-hard-night-guard':               { slug: 'custom-night-guard-for-teeth-grinding', label: 'Best Custom Night Guards' },
    'night-guard-vs-mouthguard':              { slug: 'best-night-guard-for-teeth-grinding', label: 'Best Night Guard for Teeth Grinding' },
    'how-to-clean-a-night-guard':             { slug: 'best-boil-and-bite-night-guard', label: 'Best Boil & Bite Night Guards' },
    'night-guard-making-jaw-hurt':            { slug: 'best-night-guard-for-tmj', label: 'Best Night Guards for TMJ' },
  };
  const linked = guideToReview[guide.slug];
  const linkedReview = linked && reviews.find(r => r.slug === linked.slug && r.status === 'published');
  if (linkedReview) {
    body += `<section class="from-our-tests">
  <h2>From Our Tests</h2>
  <p>If you're looking for a product that survives heavy grinding, see our caliper-measured data: <a href="/${linkedReview.slug}/"><strong>${linked.label}</strong></a>.</p>
</section>`;
  }


  const graph = [
    {
      '@type': 'Article',
      headline: guide.h1,
      author: { '@type': 'Person', name: AUTHOR_NAME },
      publisher: ORG,
      datePublished: guide.last_updated,
      dateModified: guide.last_updated
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: DOMAIN + '/' },
        { '@type': 'ListItem', position: 2, name: guide.h1, item: DOMAIN + '/' + guide.slug + '/' }
      ]
    },
    ORG
  ];
  if (guide.faq && guide.faq.length > 0) {
    graph.push(faqJsonLd(guide.faq));
    body += `<section class="faq-section"><h2>Frequently Asked Questions</h2>`;
    for (const [q, a] of guide.faq) {
      body += `<details><summary>${q}</summary><p>${a}</p></details>`;
    }
    body += `</section>`;
  }

  write(guide.slug, layout({
    title: guide.title,
    description: guide.meta,
    canonicalPath: `/${guide.slug}/`,
    h1: guide.h1,
    jsonLd: { '@context': 'https://schema.org', '@graph': graph },
    bodyHtml: body,
    noindex: guide.status !== 'published'
  }));
}

// ─── Infra Pages ──────────────────────────────────────────────────────────────

// /about/
write('about', layout({
  title: 'About BruxProof — Who We Are and How We Work',
  description: 'BruxProof is an independent product review site for night guards and bruxism products. We test everything with our own money and digital calipers.',
  canonicalPath: '/about/',
  h1: 'About BruxProof',
  jsonLd: { '@context': 'https://schema.org', '@graph': [{ '@type': 'AboutPage', name: 'About BruxProof' }, ORG] },
  bodyHtml: `
<section>
  <h2>Who We Are</h2>
  <p>BruxProof is an independent review site dedicated exclusively to testing night guards for teeth grinding and bruxism. We are not dentists or medical professionals. Our content is informational only and should not be treated as medical advice.</p>
  <p>The site is published by <strong>Gesmine-Invest Limited</strong> (UK Company Number 14120136), registered at Hardy House, 269 Poynders Gardens, London, SW4 8PQ, United Kingdom.</p>
</section>
<section>
  <h2>Why We Built This</h2>
  <p>When searching for a night guard, we found that most online "best of" lists simply copy-pasted manufacturer descriptions. No one was actually buying the products, wearing them, and measuring how fast they wore down. We decided to do it properly: buy each product, wear it for 30 nights, measure thickness loss with digital calipers, and publish the hard data.</p>
</section>
<section>
  <h2>Our Methodology (Summary)</h2>
  <p>Every night guard we review is purchased with our own money. We wear each guard for a minimum of 30 nights, measuring:</p>
  <ul>
    <li><strong>Thickness (mm)</strong> — 3-point caliper measurements before and after the test period</li>
    <li><strong>Thickness Loss (%)</strong> — to objectively grade material durability</li>
    <li><strong>Moldability / Fit Retention</strong> — tracking how well the guard holds its shape over time</li>
    <li><strong>Bite-Through Resistance</strong></li>
  </ul>
  <p>For a full breakdown, see our <a href="/how-we-test/">How We Test</a> page.</p>
</section>
<section>
  <h2>Affiliate Disclosure</h2>
  <p>Some links on this site are affiliate links. If you purchase through them, we may earn a small commission at no extra cost to you. This never influences our ratings or recommendations. See our full <a href="/disclosure/">Affiliate Disclosure</a>.</p>
</section>`
}));

// /how-we-test/
write('how-we-test', layout({
  title: 'How We Test Night Guards — BruxProof',
  description: 'A full explanation of our product testing protocol: 30 nights of wear, digital caliper measurements, and objective durability analysis.',
  canonicalPath: '/how-we-test/',
  h1: 'How We Test',
  jsonLd: { '@context': 'https://schema.org', '@graph': [ORG] },
  bodyHtml: `
<section>
  <h2>Our Core Principle</h2>
  <p>We only recommend what we have physically tested. Every night guard reviewed on BruxProof was <strong>purchased with our own money</strong>. No brands sent us free products in exchange for reviews.</p>
</section>
<section>
  <h2>Test Duration</h2>
  <p>Each night guard is worn for a <strong>minimum of 30 consecutive nights</strong> by an active bruxer. This provides enough data to observe real-world durability, thickness loss, and fit retention.</p>
</section>
<section>
  <h2>Standardized Conditions</h2>
  <p>To keep results comparable between products, every guard is tested under the same controlled conditions:</p>
  <ul>
    <li><strong>Same tester</strong> — one diagnosed sleep bruxer wears every guard, so grinding force is held constant across the sample.</li>
    <li><strong>Same measurement rig</strong> — a single calibrated digital caliper (0.01 mm resolution), 3-point average taken at the same anterior contact points before night 1 and after night 30.</li>
    <li><strong>Same environment</strong> — guards stored dry at room temperature (18–22 °C), rinsed in cold water only, never exposed to heat that could distort the plastic.</li>
    <li><strong>No overlap</strong> — only one guard is worn per 30-night block; guards are never alternated within a test period.</li>
  </ul>
</section>
<section>
  <h2>What We Measure</h2>
  <table class="spec-table">
    <thead><tr><th>Metric</th><th>Tool / Method</th><th>Why It Matters</th></tr></thead>
    <tbody>
    <tr><td>Thickness (mm)</td><td>Digital calipers (3-point average)</td><td>Tells us how bulky the guard will feel in the mouth</td></tr>
    <tr><td>Thickness Loss (%)</td><td>Digital calipers before and after 30 days</td><td>Objective measure of material durability and lifespan</td></tr>
    <tr><td>Fit Retention</td><td>Daily wear notes</td><td>Cheap materials stretch out and fall out during sleep</td></tr>
    <tr><td>Bite-Through</td><td>Visual inspection</td><td>Failure state for a night guard</td></tr>
    <tr><td>Moldability</td><td>Subjective ease-of-use scoring (1-5)</td><td>Crucial for OTC boil-and-bite guards</td></tr>
    </tbody>
  </table>
</section>
<section>
  <h2>What "Tested on Spec Only" Means</h2>
  <p>When we evaluate a product based on the manufacturer's stated specifications and independent user data rather than our own wear data, we state this clearly on the product card. No "spec-only" product will ever be called "our top pick".</p>
</section>
<section>
  <h2>Medical Disclaimer</h2>
  <p>We are not medical professionals. Our testing is that of consumer-level evaluation, not clinical assessment. The information on this site is not a substitute for professional dental advice. If you suffer from severe bruxism or TMJ, consult a licensed dentist.</p>
</section>`
}));

// /disclosure/
write('disclosure', layout({
  title: 'Affiliate Disclosure — BruxProof',
  description: 'Full FTC-compliant affiliate disclosure for BruxProof.',
  canonicalPath: '/disclosure/',
  h1: 'Affiliate Disclosure',
  jsonLd: { '@context': 'https://schema.org', '@graph': [ORG] },
  bodyHtml: `
<section>
  <p>BruxProof participates in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com. We also participate in affiliate programs for direct-to-consumer brands like Pro Teeth Guard and Remi. Some links on this site are affiliate links — if you click them and purchase a product, we may earn a small commission at no additional cost to you.</p>
  <p><strong>This does not influence our reviews, ratings, or recommendations.</strong> We purchase every product we review with our own money. Affiliate commissions help us fund the ongoing cost of buying custom guards and testing equipment.</p>
  <p>This disclosure is made in compliance with the FTC's guidelines on endorsements and testimonials.</p>
</section>`
}));

// /privacy/
write('privacy', layout({
  title: 'Privacy Policy — BruxProof',
  description: 'Privacy policy for BruxProof.',
  canonicalPath: '/privacy/',
  h1: 'Privacy Policy',
  jsonLd: { '@context': 'https://schema.org', '@graph': [ORG] },
  bodyHtml: `
<section>
  <h2>Data We Collect</h2>
  <p>This site does not collect any personal data from visitors. There are no registration forms, login systems, or newsletters at this stage. We do not use cookies for tracking.</p>
</section>
<section>
  <h2>Third-Party Links</h2>
  <p>This site contains links to Amazon and other third-party retailers. These sites have their own privacy policies, which we do not control. We recommend reviewing their policies before making a purchase.</p>
</section>
<section>
  <h2>Contact</h2>
  <p>If you have questions about this privacy policy, you can contact us via the About page.</p>
  <p><em>Last updated: ${LAST_REVIEWED}</em></p>
</section>`
}));

// /changelog/
write('changelog', layout({
  title: 'Changelog — BruxProof',
  description: 'A record of all significant updates to BruxProof.',
  canonicalPath: '/changelog/',
  h1: 'Changelog',
  jsonLd: { '@context': 'https://schema.org', '@graph': [ORG] },
  bodyHtml: `
<section>
  <ul class="changelog-list">
    <li><strong>2026-08-28</strong> — Site launched. Published 8 money-page reviews and 7 informational guides with verified clinical citations. All 7 products wear-tested over 30 nights with digital caliper measurements (thickness loss %). Sitemap: 21 URLs indexed.</li>
  </ul>
</section>`
}));

// / (Homepage)
write('.', layout({
  title: 'BruxProof — Independent Night Guard Reviews & Durability Tests',
  description: 'We test night guards for teeth grinding with digital calipers. See which custom and boil-and-bite guards survive 30 nights of heavy bruxism without wearing through.',
  canonicalPath: '/',
  h1: 'We Test Night Guards With Digital Calipers',
  subtitle: 'Independent, data-driven reviews for teeth grinding and bruxism. No fluff. Just thickness measurements, wear rates, and honest fit tests.',
  jsonLd: { '@context': 'https://schema.org', '@graph': [ORG] },
  bodyHtml: `
<section class="home-hero">
  <p>Most night guard reviews online are written by people who have never worn the product. We buy every guard with our own money, wear it for <strong>30 consecutive nights</strong>, and measure exactly how much thickness it loses using a digital caliper.</p>
  <div class="home-actions">
    <a href="/best-night-guard-for-teeth-grinding/" class="buy-btn">See Our Top Picks →</a>
    <a href="/how-we-test/" class="buy-btn secondary-btn">How We Test →</a>
  </div>
</section>

<section class="methodology-block">
  <strong>📋 Our testing standard:</strong> 7 night guards wear-tested · 30 nights each · 3-point caliper measurements · thickness loss range: <strong>2.7% – 32%</strong> · All products purchased with our own money. <a href="/how-we-test/">Full protocol →</a>
</section>

<section class="home-categories">
  <h2>Start Here</h2>
  <div class="category-grid">
    <div class="cat-card">
      <h3><a href="/best-night-guard-for-teeth-grinding/">Best Overall Night Guards</a></h3>
      <p>7 guards tested. Best overall: Pro Teeth Guard (3.2% thickness loss, 1.55 mm). Most durable: JS Dental Lab (2.7% loss over 30 nights).</p>
    </div>
    <div class="cat-card">
      <h3><a href="/custom-night-guard-for-teeth-grinding/">Best Custom Guards</a></h3>
      <p>Pro Teeth Guard, Remi & JS Dental Lab — lab-made vs dentist cost.</p>
    </div>
    <div class="cat-card">
      <h3><a href="/best-boil-and-bite-night-guard/">Best Boil &amp; Bite</a></h3>
      <p>OTC options ranked by moldability and 30-night wear data.</p>
    </div>
    <div class="cat-card">
      <h3><a href="/best-night-guard-for-tmj/">Best for TMJ</a></h3>
      <p>Guards tested for jaw pressure relief, not just tooth protection.</p>
    </div>
    <div class="cat-card">
      <h3><a href="/thinnest-night-guard/">Thinnest Night Guards</a></h3>
      <p>Measured to the mm — thin guards that still survive heavy grinding.</p>
    </div>
    <div class="cat-card">
      <h3><a href="/how-to-stop-grinding-teeth-in-your-sleep/">Bruxism Guides</a></h3>
      <p>Science-backed methods to reduce teeth grinding.</p>
    </div>
  </div>
</section>

<section class="related-guides">
  <h2>Individual Brand Reviews</h2>
  <ul>
    <li><a href="/pro-teeth-guard-review/">Pro Teeth Guard Review — Hard Acrylic Test</a></li>
    <li><a href="/remi-night-guard-review/">Remi Night Guard Review — Thickness Anomaly Found</a></li>
    <li><a href="/oral-b-nighttime-dental-guard-review/">Oral-B Nighttime Dental Guard Review</a></li>
  </ul>
</section>
  `
}));

console.log('Done.');
