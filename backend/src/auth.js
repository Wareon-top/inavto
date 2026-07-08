/* Доступ в админку: заголовок Authorization: Bearer <ADMIN_TOKEN из .env> */
export function adminOnly(req, res, next) {
  const token = process.env.ADMIN_TOKEN
  if (!token) return res.status(503).json({ error: 'ADMIN_TOKEN is not configured on the server' })
  const got = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (got !== token) return res.status(401).json({ error: 'Unauthorized' })
  next()
}
