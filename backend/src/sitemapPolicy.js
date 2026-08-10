/** Единственный источник автомобильных URL для production sitemap —
 * опубликованные записи актуального каталога в базе. */
export const catalogSitemapSlugs = (rows) => rows
  .filter((row) => !row.hidden)
  .map((row) => row.slug)
