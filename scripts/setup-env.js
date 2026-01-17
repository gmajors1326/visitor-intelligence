#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), '.env.example');

// Check if .env.local already exists
if (fs.existsSync(envLocalPath)) {
  console.log('.env.local already exists. Skipping creation.');
  process.exit(0);
}

// Read .env.example if it exists
let content = '';
if (fs.existsSync(envExamplePath)) {
  content = fs.readFileSync(envExamplePath, 'utf8');
} else {
  // Default content
  content = `# Supabase Postgres (Transaction Pooler)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@aws-1-us-east-1.pooler.supabase.com:6543/postgres

# Admin auth
ADMIN_EMAIL=your-admin@email.com
ADMIN_PASSWORD_HASH=PASTE_YOUR_BCRYPT_HASH

# Internal security
INTERNAL_KEY=generate-a-long-random-string
IP_HASH_SALT=generate-a-long-random-string
UA_HASH_SALT=generate-a-long-random-string
`;
}

// Write .env.local
fs.writeFileSync(envLocalPath, content, 'utf8');
console.log('✅ Created .env.local file');
console.log('⚠️  Please update the values in .env.local with your actual configuration');
