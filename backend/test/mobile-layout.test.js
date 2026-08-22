import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('mobile home hero keeps a readable text layer and touch-friendly controls', async () => {
  const [html, css] = await Promise.all([
    readFile(new URL('../../site/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../../site/css/style.css', import.meta.url), 'utf8')
  ])

  assert.match(html, /hero-banner-mobile-copy/)
  assert.match(html, /Автомобили из Китая/)
  assert.match(css, /@media \(max-width: 620px\)/)
  assert.match(css, /\.hero-banner-img \{ height: min\(108vw, 430px\)/)
  assert.match(css, /\.btn \{ min-height: 48px/)
  assert.match(css, /body \{ padding-bottom: calc\(72px \+ env\(safe-area-inset-bottom\)\)/)
})
