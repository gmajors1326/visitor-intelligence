# Environment Variables Guide

This document lists all environment variables required for the Visitor Intelligence Dashboard.

## Required Variables

### Database
- `DATABASE_URL` - PostgreSQL connection string (Supabase Transaction Pooler)
  - Format: `postgresql://postgres:PASSWORD@aws-1-us-east-1.pooler.supabase.com:6543/postgres`

### Admin Authentication
- `ADMIN_EMAIL` - Admin email address (for password reset validation)
  - Example: `admin@example.com`
- `ADMIN_PASSWORD_HASH` - Bcrypt hash of admin password
  - Generate with: `npm run generate-password`
  - Or: `node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your-password', 10).then(hash => console.log(hash));"`

### Internal Security
- `INTERNAL_KEY` - Secret key for internal API authentication
  - Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `IP_HASH_SALT` - Salt for hashing IP addresses
  - Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `UA_HASH_SALT` - Salt for hashing User Agents
  - Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Optional Variables

### Email (SMTP) - For Password Reset Emails
- `SMTP_HOST` - SMTP server hostname
  - Example: `smtp.gmail.com` or `smtp.sendgrid.net`
- `SMTP_PORT` - SMTP server port (usually 587 or 465)
  - Example: `587`
- `SMTP_USER` - SMTP username/email
  - Example: `your-email@gmail.com`
- `SMTP_PASSWORD` - SMTP password or app password
  - For Gmail: Use App Password
- `SMTP_FROM` - From email address (defaults to SMTP_USER)
  - Example: `noreply@yourdomain.com`

### reCAPTCHA v3 - For Bot Protection
- `RECAPTCHA_SITE_KEY` - Public site key (also set as `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`)
  - Get from: https://www.google.com/recaptcha/admin
- `RECAPTCHA_SECRET_KEY` - Private secret key
- `RECAPTCHA_SCORE_THRESHOLD` - Minimum score (0.0-1.0, default: 0.5)
  - Higher = more strict

### Redis (Upstash) - For Distributed Rate Limiting
- `UPSTASH_REDIS_REST_URL` - Upstash Redis REST URL
  - Get from: https://console.upstash.com/
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis REST Token

## Setting Up in Vercel

1. Go to your project settings: https://vercel.com/your-username/visitor-intelligence/settings/environment-variables

2. Add all required variables:
   - Click "Add New"
   - Enter variable name and value
   - Select environments (Production, Preview, Development)
   - Click "Save"

3. For public variables (like `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`):
   - Add with `NEXT_PUBLIC_` prefix
   - These are exposed to the browser

4. After adding variables:
   - Redeploy your project
   - Variables take effect on next deployment

## Local Development

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in all required variables in `.env.local`

3. For public variables, also add them to `.env.local`:
   ```
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-site-key
   ```

## Security Notes

- Never commit `.env.local` to version control
- Use different values for development and production
- Rotate secrets regularly
- Use strong, random values for salts and keys
- Keep `ADMIN_PASSWORD_HASH` secure
- Don't share environment variables publicly

## Generating Secure Values

```bash
# Generate random 32-byte hex string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate password hash
npm run generate-password
```
