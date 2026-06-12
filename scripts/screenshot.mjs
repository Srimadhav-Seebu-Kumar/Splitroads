/**
 * Dev visual-iteration tool: screenshots app surfaces as the seed user.
 * Usage: node scripts/screenshot.mjs [route ...]   (default: all)
 * Output: .dev/shots/<name>.png
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const WEB = process.env.WEB_URL ?? 'http://localhost:3000'
const API = process.env.API_URL ?? 'http://localhost:3001/api/v1'
const EMAIL = 'river@splitroads.dev'
const PASSWORD = 'flowing-rivers-demo-2026'

const ALL = ['/login', '/today', '/phantoms', '/journal', '/dna']
const routes = process.argv.slice(2).length ? process.argv.slice(2) : ALL

mkdirSync('.dev/shots', { recursive: true })

const res = await fetch(`${API}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
})
const json = await res.json()
if (!json.ok) throw new Error(`login failed: ${JSON.stringify(json)}`)
const token = json.data.token

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1.5 })

for (const route of routes) {
  const page = await ctx.newPage()
  if (route !== '/login') {
    await page.addInitScript(([t]) => localStorage.setItem('sr_token', t), [token])
  }
  await page.goto(`${WEB}${route}`, { waitUntil: 'domcontentloaded' })
  // Let data load and the river reveal play out (2.4s) plus settle
  await page.waitForTimeout(4500)
  const name = route === '/' ? 'root' : route.slice(1).replaceAll('/', '-')
  await page.screenshot({ path: `.dev/shots/${name}.png` })
  console.log(`shot ${name}.png`)
  await page.close()
}

await browser.close()
