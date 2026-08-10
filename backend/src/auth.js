import crypto from 'crypto'

function sameToken(got, expected) {
  if (!got || !expected) return false
  const a = Buffer.from(got)
  const b = Buffer.from(expected)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

/* Доступ в админку: заголовок Authorization: Bearer <ADMIN_TOKEN из .env> */
export function adminOnly(req, res, next) {
  const token = process.env.ADMIN_TOKEN
  if (!token) return res.status(503).json({ error: 'ADMIN_TOKEN is not configured on the server' })
  const got = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!sameToken(got, token)) return res.status(401).json({ error: 'Unauthorized' })
  next()
}

/* Роль по токену: admin (ADMIN_TOKEN) или staff (STAFF_TOKEN — китайский представитель). */
export function roleOf(req) {
  const got = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (sameToken(got, process.env.ADMIN_TOKEN)) return 'admin'
  if (sameToken(got, process.env.STAFF_TOKEN)) return 'staff'
  return null
}

/* Журнал сделок: пускаем и админа, и представителя; роль кладём в req.role. */
export function staffOnly(req, res, next) {
  if (!process.env.ADMIN_TOKEN) return res.status(503).json({ error: 'ADMIN_TOKEN is not configured on the server' })
  const role = roleOf(req)
  if (!role) return res.status(401).json({ error: 'Unauthorized' })
  req.role = role
  next()
}
