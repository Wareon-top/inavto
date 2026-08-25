import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const main = fs.readFileSync(new URL('../../site/js/main.js', import.meta.url), 'utf8')
const home = fs.readFileSync(new URL('../../site/index.html', import.meta.url), 'utf8')
const selections = fs.readFileSync(new URL('../src/routes/selections.js', import.meta.url), 'utf8')

test('short lead form replaces the multi-step quiz', () => {
  assert.doesNotMatch(main, /QUIZ_BRANCHES|quizSteps|quiz_step_/)
  assert.match(main, /Телефон или Telegram/)
  assert.match(main, /name="car"/)
  assert.match(main, /name="city"/)
  assert.match(main, /validContact/)
  assert.match(main, /matchMedia\('\(max-width: 620px\)'\)/)
  assert.match(main, /Город доставки \(необязательно\)/)
  assert.doesNotMatch(home, /class="lead-chips"/)
  assert.match(home, /Телефон или Telegram/)
})

test('success is shown only after a 201 response and errors preserve the form', () => {
  assert.match(main, /response\.status !== 201/)
  assert.match(main, /lead_submit_success/)
  assert.match(main, /lead_submit_error/)
  assert.match(main, /if \(!result\.ok\) \{ showLeadError\(f\); return; \}/)
  assert.match(main, /button\.disabled = false/)
  assert.match(home, /if \(!result\.ok\) \{ A\.showLeadError\(form\); return; \}/)
})

test('lead analytics and requests contain page, car and UTM attribution', () => {
  for (const event of ['lead_form_view', 'lead_form_start', 'lead_submit_success', 'lead_submit_error']) {
    assert.match(main, new RegExp(event))
  }
  for (const key of ['page_url', 'car_name', 'source', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
    assert.match(main, new RegExp(key))
    assert.match(selections, new RegExp(`req\\.body\\?\\.${key}`))
  }
  assert.match(selections, /Страница: \$\{pageUrl\}/)
  assert.match(selections, /Автомобиль: \$\{carName\}/)
  assert.match(selections, /Источник: \$\{source\}/)
})
