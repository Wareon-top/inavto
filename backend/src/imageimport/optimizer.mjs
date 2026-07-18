/* Оптимизация: WebP, ширина по конфигу, качество, EXIF удаляется (sharp не
   переносит метаданные без withMetadata), автоповорот по EXIF до удаления. */
import sharp from 'sharp'
import crypto from 'crypto'

export const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex')

export async function toWebp(buf, { width, quality }) {
  return sharp(buf)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality })
    .toBuffer()
}
