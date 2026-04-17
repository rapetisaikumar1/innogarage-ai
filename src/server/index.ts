import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import websocket from '@fastify/websocket'
import { config } from 'dotenv'
import { authRoutes } from './routes/auth'
import { profileRoutes } from './routes/profile'
import { planRoutes } from './routes/plan'
import { interviewRoutes } from './routes/interview'
import nodemailer from 'nodemailer'

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

  // Temporary debug route — tests SendGrid SMTP on port 2525
  app.get('/debug/email', async (_req, reply) => {
    const pass = process.env.SENDGRID_SMTP_PASS
    if (!pass) {
      return reply.send({ ok: false, error: 'Missing SENDGRID_SMTP_PASS env var' })
    }
    try {
      const t = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 2525,
        secure: false,
        auth: { user: 'apikey', pass }
      })
      await t.sendMail({
        from: `"innogarage.ai" <${process.env.SENDGRID_FROM_EMAIL ?? 'noreply@innogarage.ai'}>`,
        to: 'rapetisaikumar1999@gmail.com',
        subject: 'Railway email test',
        text: 'Railway SendGrid SMTP is working.'
      })
      return { ok: true, host: 'smtp.sendgrid.net', port: 2525 }
    } catch (err: unknown) {
      return reply.send({ ok: false, error: (err as Error).message })
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
