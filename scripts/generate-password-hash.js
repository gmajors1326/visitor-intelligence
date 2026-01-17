#!/usr/bin/env node

const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter password to hash: ', async (password) => {
  try {
    const hash = await bcrypt.hash(password, 10);
    console.log('\n✅ Password hash generated:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(hash);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 Add this to Vercel environment variables:');
    console.log('   Variable: ADMIN_PASSWORD_HASH');
    console.log('   Value: ' + hash);
    console.log('\n⚠️  After updating, redeploy your Vercel project.');
  } catch (error) {
    console.error('Error generating hash:', error);
  }
  rl.close();
});
