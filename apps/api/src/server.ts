/**
 * Split-Roads API server entry point.
 * Registers plugins, then routes, then listens.
 */
import Fastify from 'fastify'
import { registerPlugins } from './plugins'
import { registerRoutes } from './routes'

const app = Fastify({
  logger: {
    level: process.env['LOG_LEVEL'] ?? 'info',
    // Scrub sensitive fields from logs (security baseline)
    redact: ['req.headers.authorization', 'req.body.password', 'req.body.api_key', 'req.body.api_secret'],
  },
})

async function start() {
  await registerPlugins(app)
  await registerRoutes(app)

  const port = parseInt(process.env['PORT'] ?? '3001')
  const host = process.env['HOST'] ?? '0.0.0.0'

  await app.listen({ port, host })
  app.log.info(`Split-Roads API ready on http://${host}:${port}`)
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
