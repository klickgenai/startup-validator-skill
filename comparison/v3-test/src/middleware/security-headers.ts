// =============================================================================
// Security Headers Middleware — 7 security headers (guardrail 1 — blind spot compensation)
// =============================================================================

import type { Request, Response, NextFunction } from 'express';

export function securityHeadersMiddleware(_req: Request, res: Response, next: NextFunction): void {
  // 1. Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // 2. Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // 3. XSS protection (legacy browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // 4. Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 5. Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");

  // 6. Strict Transport Security
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // 7. Permissions Policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  next();
}
