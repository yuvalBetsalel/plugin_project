#!/usr/bin/env node

// Helper script to generate secrets for Fly.io deployment

import { randomBytes } from 'crypto';

console.log('🔐 Generating secrets for Fly.io deployment\n');

const adminApiKey = randomBytes(32).toString('hex');
const sessionSecret = randomBytes(32).toString('hex');

console.log('='.repeat(70));
console.log('ADMIN_API_KEY (64 characters):');
console.log(adminApiKey);
console.log('='.repeat(70));
console.log();

console.log('='.repeat(70));
console.log('SESSION_SECRET (64 characters):');
console.log(sessionSecret);
console.log('='.repeat(70));
console.log();

console.log('📋 Next steps:');
console.log('1. Save these values securely (password manager recommended)');
console.log('2. Add them as secrets in Fly.io dashboard:');
console.log('   - Go to: https://fly.io/dashboard/<your-app>/secrets');
console.log('   - Add ADMIN_API_KEY');
console.log('   - Add SESSION_SECRET');
console.log('3. Or use flyctl:');
console.log(`   flyctl secrets set ADMIN_API_KEY=${adminApiKey}`);
console.log(`   flyctl secrets set SESSION_SECRET=${sessionSecret}`);
console.log();

console.log('🔑 The ADMIN_API_KEY is needed to access the admin dashboard');
console.log('   Save it in your password manager or somewhere secure!');
console.log();
