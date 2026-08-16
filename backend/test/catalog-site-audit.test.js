import assert from 'node:assert/strict'
import test from 'node:test'
import { auditCatalogSite } from '../src/catalogSiteAudit.js'

const domain = 'https://inavtoasia.ru'
const page = (slug) => `<!doctype html><link rel="canonical" href="${domain}/cars/${slug}.html"><h1>${slug}</h1>`

test('catalog audit accepts an exact visible database and sitemap match', () => {
  const result = auditCatalogSite({
    rows: [{ slug: 'active-one', hidden: 0 }, { slug: 'hidden-one', hidden: 1 }],
    expectedTotal: 2,
    sitemap: `<?xml version="1.0"?><urlset><url><loc>${domain}/</loc></url><url><loc>${domain}/cars/active-one.html</loc></url></urlset>`,
    robots: `User-agent: *\nSitemap: ${domain}/sitemap.xml\n`,
    readPage: page,
  })

  assert.equal(result.ok, true)
  assert.equal(result.total, 2)
  assert.equal(result.active, 1)
  assert.equal(result.sitemapCars, 1)
})

test('catalog audit rejects missing, extra, duplicate and non-indexable car URLs', () => {
  const result = auditCatalogSite({
    rows: [{ slug: 'active-one', hidden: 0 }, { slug: 'active-two', hidden: 0 }],
    expectedTotal: 2,
    sitemap: `<?xml version="1.0"?><urlset>
      <url><loc>${domain}/cars/active-one.html</loc></url>
      <url><loc>${domain}/cars/active-one.html</loc></url>
      <url><loc>${domain}/cars/old-car.html?from=test</loc></url>
    </urlset>`,
    robots: 'User-agent: *\n',
    readPage: (slug) => slug === 'active-one'
      ? `${page(slug)}<meta name="robots" content="noindex">`
      : '',
  })

  assert.equal(result.ok, false)
  assert.match(result.issues.join('\n'), /дубли URL/)
  assert.match(result.issues.join('\n'), /параметрами/)
  assert.match(result.issues.join('\n'), /отсутствуют карточки/)
  assert.match(result.issues.join('\n'), /лишние карточки/)
  assert.match(result.issues.join('\n'), /robots\.txt/)
  assert.match(result.issues.join('\n'), /noindex/)
  assert.match(result.issues.join('\n'), /не найден HTML/)
})
