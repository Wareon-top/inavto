import assert from 'node:assert/strict'
import test from 'node:test'
import { sitemapXML } from '../../site/build-pages.mjs'
import { catalogSitemapSlugs } from '../src/sitemapPolicy.js'

test('production sitemap contains only visible database cars', async () => {
  const rows = [
    { slug: 'published-car', hidden: 0 },
    { slug: 'hidden-car', hidden: 1 },
  ]
  const sitemap = sitemapXML(catalogSitemapSlugs(rows))

  assert.match(sitemap, /\/cars\/published-car\.html/)
  assert.doesNotMatch(sitemap, /\/cars\/hidden-car\.html/)
  assert.doesNotMatch(sitemap, /\/cars\/aito-m7\.html/)
})
