import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('mobile home hero uses the supplied mobile banner and touch-friendly controls', async () => {
  const [html, css] = await Promise.all([
    readFile(new URL('../../site/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../../site/css/style.css', import.meta.url), 'utf8')
  ])

  assert.match(html, /<picture>/)
  assert.match(html, /media="\(max-width: 620px\)" srcset="img\/hero-banner-mobile\.webp"/)
  assert.match(css, /@media \(max-width: 620px\)/)
  assert.match(css, /\.hero-banner-img \{ height: auto; object-fit: initial; opacity: 1; \}/)
  assert.doesNotMatch(css, /hero-banner-mobile-copy/)
  assert.match(css, /\.btn \{ min-height: 48px/)
  assert.match(css, /body \{ padding-bottom: calc\(72px \+ env\(safe-area-inset-bottom\)\)/)
})
