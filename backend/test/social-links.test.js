import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const telegram = 'https://t.me/Inavtoasia'
const dzen = 'https://dzen.ru/id/6a885c029f2d295ebd3d35fe?share_to=link'

test('home page exposes the official social channels with analytics goals', async () => {
  const html = await readFile(new URL('../../site/index.html', import.meta.url), 'utf8')

  assert.match(html, new RegExp(telegram.replaceAll('/', '\\/')))
  assert.match(html, new RegExp(dzen.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.match(html, /data-goal="social_telegram_click"/)
  assert.match(html, /data-goal="social_dzen_click"/)
  assert.match(html, /"sameAs":\["https:\/\/t\.me\/Inavtoasia","https:\/\/dzen\.ru\/id\/6a885c029f2d295ebd3d35fe"\]/)
})

test('footer links to the official Dzen channel', async () => {
  const script = await readFile(new URL('../../site/js/main.js', import.meta.url), 'utf8')

  assert.match(script, new RegExp(dzen.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.match(script, /data-goal="social_dzen_click"/)
})
