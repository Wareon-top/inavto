import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { CITIES, PRIORITY_CITY_SLUGS, geoHTML, sitemapXML } from '../../site/build-pages.mjs'

test('only five enriched city pages are indexable and listed in sitemap', () => {
  assert.deepEqual(PRIORITY_CITY_SLUGS, [
    'moskva', 'sankt-peterburg', 'novosibirsk', 'ekaterinburg', 'krasnodar',
  ])

  const sitemap = sitemapXML(['current-car'])
  for (const slug of PRIORITY_CITY_SLUGS) {
    const city = CITIES.find((item) => item[0] === slug)
    const page = geoHTML(city, CITIES.indexOf(city))
    assert.doesNotMatch(page, /<meta name="robots" content="noindex,follow">/)
    assert.match(page, /Особенности направления/)
    assert.match(sitemap, new RegExp(`/gorod/${slug}\\.html`))
  }

  const secondary = CITIES.find((item) => item[0] === 'omsk')
  assert.match(geoHTML(secondary, CITIES.indexOf(secondary)), /<meta name="robots" content="noindex,follow">/)
  assert.doesNotMatch(sitemap, /\/gorod\/omsk\.html/)
  assert.doesNotMatch(sitemap, /vydannye-avto\.html/)
})

test('delivered cars placeholder stays accessible but is not indexable', () => {
  const page = fs.readFileSync(new URL('../../site/vydannye-avto.html', import.meta.url), 'utf8')
  assert.match(page, /<meta name="robots" content="noindex,follow">/)
})
