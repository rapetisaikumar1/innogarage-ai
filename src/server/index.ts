import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import websocket from '@fastify/websocket'
import { config } from 'dotenv'
import { authRoutes } from './routes/auth'
import { profileRoutes } from './routes/profile'
import { planRoutes } from './routes/plan'
import { interviewRoutes } from './routes/interview'

config()

const app = Fastify({ logger: true, bodyLimit: 10 * 1024 * 1024 })

async function start(): Promise<void> {
  await app.register(cors, {
    origin: '*',
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  })
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } })
  await app.register(websocket)

  await app.register(authRoutes)
  await app.register(profileRoutes)
  await app.register(planRoutes)
  await app.register(interviewRoutes)

  // Debug endpoint — test email delivery synchronously
  app.post('/debug/test-email', async (request, reply) => {
    const { email } = request.body as { email: string }
    if (!email) return reply.code(400).send({ error: 'email required' })
    try {
      const { sendVerificationEmail } = await import('./services/email')
      await sendVerificationEmail(email, '123456', 'Test User')
      return { success: true, message: `Email sent to ${email}` }
    } catch (err: unknown) {
      const e = err as { message?: string; response?: { body?: unknown } }
      console.error('[debug/test-email] error:', e?.response?.body || e?.message)
      return reply.code(500).send({
        error: e?.message,
        details: e?.response?.body
      })
    }
  })

  const port = parseInt(process.env.PORT || process.env.SERVER_PORT || '3847')
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`Server running on http://localhost:${port}`)
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})

export { app }
