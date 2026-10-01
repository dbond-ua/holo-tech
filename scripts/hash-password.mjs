#!/usr/bin/env node
// Generates a password hash compatible with src/lib/admin-auth.ts, so you can
// create the first manager account by hand in Supabase before the admin
// panel has any users to log in with.
//
// Usage:
//   node scripts/hash-password.mjs "your-password-here"
//
// Then insert the manager in the Supabase SQL editor:
//   insert into managers (name, email, password_hash)
//   values ('Your Name', 'you@example.com', '<paste the printed hash>');

import { randomBytes, scryptSync } from "crypto";

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/hash-password.mjs <password>");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");
console.log(`${salt}:${hash}`);
