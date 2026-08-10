import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'

function allowedOrigins() {
  return new Set(
    String(process.env.CORS_ORIGINS || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  )
}

export function corsMiddleware() {
  const allow = allowedOrigins()
  return cors({
    origin(origin, done) {
      // Server-to-server and same-origin requests do not need an Origin header.
      if (!origin) return done(null, true)
      return done(null, allow.has(origin))
    },
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    maxAge: 86400,
  })
}

export const securityHeaders = helmet({
  // /admin and /lk currently contain inline scripts and styles. A strict CSP
  // will be enabled after those pages are split into static assets.
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: 'same-origin' },
})

function limiter({ windowMs, limit, message }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: message },
  })
}

export const apiLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  limit: 1200,
  message: 'Too many requests',
})

export const leadLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  limit: 12,
  message: 'Слишком много заявок. Попробуйте позже.',
})

export const clientCabinetLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  message: 'Слишком много запросов. Попробуйте позже.',
})
