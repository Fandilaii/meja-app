/**
 * One-time script: create a manager Firebase Auth account
 * and set the custom claim { role: 'manager' } via Admin SDK.
 *
 * Usage:
 *   node scripts/create-manager.mjs
 *
 * Prerequisites:
 *   1. Download a Firebase Admin service account key from:
 *      Firebase Console → Project Settings → Service Accounts → Generate new private key
 *   2. Save it as  scripts/serviceAccountKey.json  (gitignored)
 *   3. npm install firebase-admin  (already in devDependencies after this run)
 */

import { readFileSync } from 'fs'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

let admin
try {
  admin = require('firebase-admin')
} catch {
  console.error('firebase-admin not installed. Run: npm install -D firebase-admin')
  process.exit(1)
}

const serviceAccount = JSON.parse(
  readFileSync(new URL('./serviceAccountKey.json', import.meta.url), 'utf8')
)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

// ── Config — pass via environment variables, never hardcode ──────────────────
// Usage:
//   MANAGER_EMAIL=you@example.com MANAGER_PASSWORD=yourpass node scripts/create-manager.mjs
const MANAGER_EMAIL    = process.env.MANAGER_EMAIL    ?? ''
const MANAGER_PASSWORD = process.env.MANAGER_PASSWORD ?? ''
const MANAGER_NAME     = process.env.MANAGER_NAME     ?? 'Manager'

if (!MANAGER_EMAIL || !MANAGER_PASSWORD) {
  console.error('Error: set MANAGER_EMAIL and MANAGER_PASSWORD environment variables.')
  console.error('Example:')
  console.error('  MANAGER_EMAIL=you@example.com MANAGER_PASSWORD=yourpass node scripts/create-manager.mjs')
  process.exit(1)
}
// ─────────────────────────────────────────────────────────────────────────────

async function run() {
  const auth = admin.auth()

  // Create (or fetch existing) user
  let user
  try {
    user = await auth.createUser({
      email:        MANAGER_EMAIL,
      password:     MANAGER_PASSWORD,
      displayName:  MANAGER_NAME,
    })
    console.log(`✅ Created user: ${user.uid}`)
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      user = await auth.getUserByEmail(MANAGER_EMAIL)
      console.log(`ℹ️  User already exists: ${user.uid}`)
    } else {
      throw err
    }
  }

  // Set custom claim
  await auth.setCustomUserClaims(user.uid, { role: 'manager' })
  console.log(`✅ Custom claim set: { role: 'manager' }`)
  console.log()
  console.log('─────────────────────────────────────────')
  console.log(`Email    : ${MANAGER_EMAIL}`)
  console.log(`Password : ${MANAGER_PASSWORD}`)
  console.log(`UID      : ${user.uid}`)
  console.log('─────────────────────────────────────────')
  console.log()
  console.log('Login at: https://meja-app.vercel.app/login')

  process.exit(0)
}

run().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
