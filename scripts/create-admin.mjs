// Creates (or resets the password of) an admin login.
//   node scripts/create-admin.mjs admin@example.com "a strong password"
// Uses the local stack's keys unless SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are set.
import { execSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error('Usage: node scripts/create-admin.mjs <email> <password>');
  process.exit(1);
}

let url = process.env.SUPABASE_URL;
let key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  const out = execSync('npx supabase status -o env', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  url = out.match(/^API_URL="?([^"\n]+)"?/m)?.[1];
  key = out.match(/^SERVICE_ROLE_KEY="?([^"\n]+)"?/m)?.[1];
}

const admin = createClient(url, key, { auth: { persistSession: false } });
const { data: list } = await admin.auth.admin.listUsers();
const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

const { error } = existing
  ? await admin.auth.admin.updateUserById(existing.id, { password })
  : await admin.auth.admin.createUser({ email, password, email_confirm: true });
if (error) {
  console.error(error.message);
  process.exit(1);
}
console.log(`${existing ? 'Password updated for' : 'Admin created:'} ${email}`);
