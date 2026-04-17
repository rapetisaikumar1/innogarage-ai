import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import websocket from '@fastify/websocket'
import { config } from 'dotenv'
import { authRoutes } from './routes/auth'
import { profileRoutes } from './routes/profile'
import { planRoutes } from './routes/plan'
import { interviewRoutes } from './routes/interview'
import sgMail from '@sendgrid/mail'

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

  // Temporary debug route — tests SendGrid HTTP API
  app.get('/debug/email', async (_req, reply) => {
    const apiKey = process.env.SENDGRID_SMTP_PASS
    const from = process.env.SENDGRID_FROM_EMAIL ?? 'noreply@innogarage.ai'
    if (!apiKey) {
      return reply.send({ ok: false, error: 'Missing SENDGRID_SMTP_PASS env var' })
    }
    try {
      sgMail.setApiKey(apiKey)
      await sgMail.send({
        from,
        to: 'rapetisaikumar1999@gmail.com',
        subject: 'Railway email test',
        text: 'Railway SendGrid HTTP API is working.'
      })
      return { ok: true, provider: 'sendgrid-http', from }
    } catch (err: unknown) {
      const msg = (err as Error).message
      return reply.send({ ok: false, error: msg })
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
