/**
 * Dev visual-iteration tool: screenshots app surfaces per persona.
 * Usage:
 *   node scripts/screenshot.mjs                  # all personas, key routes
 *   node scripts/screenshot.mjs river /today     # one persona, one route
 * Output: .dev/shots/<persona>-<route>.png
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const WEB = process.env.WEB_URL ?? 'http://localhost:3000'
const API = process.env.API_URL ?? 'http://localhost:3001/api/v1'
const PASSWORD = 'splitroads-demo-2026'

const PERSONAS = {
  river: 'river@splitroads.dev',
  dawn: 'dawn@splitroads.dev',
  sol: 'sol@splitroads.dev',
  new: 'new@splitroads.dev',
}
const ROUTES = ['/today', '/phantoms', '/journal', '/dna']

const argPersona = process.argv[2]
const argRoute = process.argv[3]
const personaKeys = argPersona && PERSONAS[argPersona] ? [argPersona] : Object.keys(PERSONAS)
const routes = argRoute ? [argRoute] : ROUTES

mkdirSync('.dev/shots', { recursive: true })

async function tokenFor(email) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
  })
  const json = await res.json()
  if (!json.ok) throw new Error(`login ${email}: ${JSON.stringify(json)}`)
  return json.data.token
}

const browser = await chromium.launch()

// Login page once (no auth)
{
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1.5 })
  const page = await ctx.newPage()
  await page.goto(`${WEB}/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)
  await page.screenshot({ path: '.dev/shots/login.png' })
  console.log('shot login.png')
  await ctx.close()
}

for (const key of personaKeys) {
  const token = await tokenFor(PERSONAS[key])
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1.5 })
  await ctx.addInitScript(([t]) => localStorage.setItem('sr_token', t), [token])
  for (const route of routes) {
    const page = await ctx.newPage()
    await page.goto(`${WEB}${route}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(4200)
    const name = `${key}-${route.slice(1).replaceAll('/', '-')}`
    await page.screenshot({ path: `.dev/shots/${name}.png` })
    console.log(`shot ${name}.png`)
    await page.close()
  }
  await ctx.close()
}

await browser.close()
