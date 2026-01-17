# Security Features

This document outlines the security measures implemented in the Visitor Intelligence Dashboard.

## Authentication Security

### Password Protection
- **Bcrypt Hashing**: Passwords are hashed using bcrypt with 10 rounds
- **Password Strength Requirements**:
  - Minimum 8 characters
  - Maximum 128 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character

### Account Lockout
- **Maximum Attempts**: 5 failed login attempts
- **Lockout Duration**: 15 minutes
- **Attempt Window**: Failed attempts reset after 15 minutes
- Prevents brute force attacks

### Rate Limiting
- **Login Attempts**: 5 attempts per 15 minutes per IP
- **Forgot Password**: 3 requests per hour per IP
- **Password Reset**: 5 attempts per hour per IP
- Returns HTTP 429 (Too Many Requests) when exceeded

## Password Reset Security

### Email Validation
- Only the configured `ADMIN_EMAIL` can request password resets
- Generic success messages prevent email enumeration attacks
- Tokens are only generated for valid admin emails

### Reset Token Security
- **Token Length**: 32 bytes (64 hex characters)
- **Expiration**: 1 hour
- **Single Use**: Tokens are deleted after use
- **Secure Generation**: Uses crypto.randomBytes()

## Session Security

### Cookie Security
- **HttpOnly**: Prevents JavaScript access
- **Secure**: Only sent over HTTPS in production
- **SameSite**: Set to 'strict' to prevent CSRF attacks
- **Max Age**: 7 days

## Data Protection

### IP Address Hashing
- IP addresses are hashed using SHA-256 with salt
- Salt stored in `IP_HASH_SALT` environment variable
- Prevents IP address tracking

### User Agent Hashing
- User agents are hashed using SHA-256 with salt
- Salt stored in `UA_HASH_SALT` environment variable
- Protects user privacy

## API Security

### Internal API Protection
- Internal API routes require `INTERNAL_KEY` header
- Prevents unauthorized access to logging endpoints

### Dynamic Route Configuration
- All API routes marked as `force-dynamic`
- Prevents static optimization and caching of sensitive data

## Recommendations for Production

### 1. Use Redis for Rate Limiting
Currently using in-memory storage. For production with multiple instances:
```typescript
// Use Redis or Upstash for distributed rate limiting
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
```

### 2. Implement CAPTCHA
Add CAPTCHA to login and forgot password forms:
- Google reCAPTCHA v3
- hCaptcha
- Cloudflare Turnstile

### 3. Email Verification
- Send password reset links via email (not shown in response)
- Use a service like SendGrid, Resend, or AWS SES
- Implement email templates

### 4. Two-Factor Authentication (2FA)
- Add TOTP (Time-based One-Time Password) support
- Use libraries like `speakeasy` or `otplib`
- Store 2FA secrets securely

### 5. Security Headers
Add security headers in `next.config.js`:
```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ];
}
```

### 6. Logging and Monitoring
- Log all authentication attempts (successful and failed)
- Monitor for suspicious patterns
- Set up alerts for multiple failed attempts
- Use services like Sentry, LogRocket, or Datadog

### 7. Database Security
- Use connection pooling
- Enable SSL/TLS for database connections
- Regularly rotate database credentials
- Use read-only database users where possible

### 8. Environment Variables
- Never commit `.env.local` to version control
- Use Vercel's environment variables for production
- Rotate secrets regularly
- Use different secrets for development/production

### 9. HTTPS Enforcement
- Ensure all traffic is over HTTPS
- Use HSTS (HTTP Strict Transport Security)
- Redirect HTTP to HTTPS

### 10. Regular Security Audits
- Keep dependencies updated (`npm audit`)
- Review and update security policies
- Conduct penetration testing
- Monitor security advisories

## Current Security Status

✅ Password hashing with bcrypt
✅ Account lockout after failed attempts
✅ Rate limiting on authentication endpoints
✅ Email validation for password reset
✅ Secure token generation and expiration
✅ HttpOnly and Secure cookies
✅ IP and User Agent hashing
✅ Internal API key protection

⚠️ In-memory rate limiting (use Redis for production)
⚠️ No CAPTCHA (recommended for production)
⚠️ No email sending (reset links shown in dev mode)
⚠️ No 2FA (recommended for production)
⚠️ No security headers (recommended)

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:
1. Do not open a public issue
2. Contact the maintainer privately
3. Provide detailed information about the vulnerability
4. Allow time for the issue to be addressed before disclosure
