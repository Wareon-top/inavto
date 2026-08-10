import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

test('geo pages replace legacy model links with the live API catalog', () => {
  const script = fs.readFileSync(new URL('../../site/js/main.js', import.meta.url), 'utf8')

  assert.match(script, /A\.CATALOG_FROM_API = true/)
  assert.match(script, /function renderGeoCatalog\(\)/)
  assert.match(script, /A\.CARS\.slice\(0, 6\)\.map\(A\.carCard\)/)
  assert.match(script, /renderGeoCatalog\(\)/)
})
