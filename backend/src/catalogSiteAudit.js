const DEFAULT_DOMAIN = 'https://inavtoasia.ru'

const uniq = (items) => [...new Set(items)]

export function sitemapLocations(xml) {
  return [...String(xml || '').matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((match) => match[1])
}

export function auditCatalogSite({
  rows,
  sitemap,
  robots,
  readPage,
  domain = DEFAULT_DOMAIN,
  expectedTotal,
}) {
  const issues = []
  const allRows = Array.isArray(rows) ? rows : []
  const visibleRows = allRows.filter((row) => !row.hidden)
  const expectedSlugs = visibleRows.map((row) => String(row.slug || '').trim())
  const expectedUrls = expectedSlugs.map((slug) => `${domain}/cars/${slug}.html`)
  const locations = sitemapLocations(sitemap)
  const carLocations = locations.filter((url) => url.startsWith(`${domain}/cars/`))

  if (expectedTotal !== undefined && allRows.length !== Number(expectedTotal)) {
    issues.push(`число машин изменилось: ожидалось ${expectedTotal}, получено ${allRows.length}`)
  }
  if (!String(sitemap || '').startsWith('<?xml') || !String(sitemap || '').includes('<urlset')) {
    issues.push('sitemap.xml не похож на корректный XML sitemap')
  }
  if (expectedSlugs.some((slug) => !/^[a-z0-9-]{2,60}$/.test(slug))) {
    issues.push('в базе найден некорректный slug автомобиля')
  }
  if (uniq(expectedSlugs).length !== expectedSlugs.length) {
    issues.push('в базе найдены дубли slug автомобилей')
  }
  if (uniq(locations).length !== locations.length) {
    issues.push('sitemap содержит дубли URL')
  }
  if (locations.some((url) => url.includes('?') || url.includes('#'))) {
    issues.push('sitemap содержит URL с параметрами или фрагментами')
  }

  const expected = new Set(expectedUrls)
  const actual = new Set(carLocations)
  const missing = expectedUrls.filter((url) => !actual.has(url))
  const extra = carLocations.filter((url) => !expected.has(url))
  if (missing.length) issues.push(`в sitemap отсутствуют карточки: ${missing.join(', ')}`)
  if (extra.length) issues.push(`в sitemap есть лишние карточки: ${extra.join(', ')}`)

  if (!String(robots || '').includes(`Sitemap: ${domain}/sitemap.xml`)) {
    issues.push('robots.txt не содержит адрес production sitemap')
  }

  if (typeof readPage === 'function') {
    for (const slug of expectedSlugs) {
      const page = readPage(slug)
      if (!page) {
        issues.push(`не найден HTML карточки: ${slug}`)
        continue
      }
      const canonical = `<link rel="canonical" href="${domain}/cars/${slug}.html">`
      if (!page.includes(canonical)) issues.push(`неверный canonical карточки: ${slug}`)
      if (/<meta[^>]+(?:name=["']robots["'][^>]+content=["'][^"']*noindex|content=["'][^"']*noindex[^>]+name=["']robots["'])/i.test(page)) {
        issues.push(`активная карточка закрыта noindex: ${slug}`)
      }
    }
  }

  return {
    ok: issues.length === 0,
    total: allRows.length,
    active: visibleRows.length,
    sitemapCars: carLocations.length,
    issues,
  }
}
