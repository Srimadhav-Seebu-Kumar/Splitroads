import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { validateBody } from '../lib/validate'
import { ok } from '../lib/errors'
import * as authService from '../services/auth.service'

const RegisterBodySchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(12).max(128),
  display_name: z.string().max(80).optional(),
})

const LoginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', async (req, reply) => {
    const body = validateBody(RegisterBodySchema, req.body)
    const user = await authService.register(body.email, body.password, body.display_name)
    const token = authService.issueToken(app, user)
    return reply.status(201).send(ok({ user, token }))
  })

  app.post('/auth/login', async (req, reply) => {
    const body = validateBody(LoginBodySchema, req.body)
    const user = await authService.login(body.email, body.password)
    const token = authService.issueToken(app, user)
    return reply.send(ok({ user, token }))
  })

  app.get('/auth/me', async (req, reply) => {
    await req.authenticate()
    const user = await authService.getUser(req.userId)
    return reply.send(ok(user))
  })

  app.post('/auth/logout', async (req, reply) => {
    await req.authenticate()
    // Token is stateless JWT; client discards it. Return 200.
    return reply.send(ok({ message: 'Logged out' }))
  })
}
