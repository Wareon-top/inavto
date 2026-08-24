import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

test('lead requests include the current page URL and car name', () => {
  const main = fs.readFileSync(new URL('../../site/js/main.js', import.meta.url), 'utf8')
  const selections = fs.readFileSync(new URL('../src/routes/selections.js', import.meta.url), 'utf8')

  assert.match(main, /page_url: window\.location\.href/)
  assert.match(main, /car_name: carName/)
  assert.match(main, /body: JSON\.stringify\(requestPayload\)/)
  assert.match(selections, /req\.body\?\.page_url/)
  assert.match(selections, /req\.body\?\.car_name/)
  assert.match(selections, /Страница: \$\{pageUrl\}/)
  assert.match(selections, /Автомобиль: \$\{carName\}/)
})
