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

  // Temporary debug route — checks email env vars and sends a test email
  app.get('/debug/email', async (_req, reply) => {
    const user = process.env.GMAIL_USER
    const pass = process.env.GMAIL_APP_PASSWORD
    if (!user || !pass) {
      return reply.send({ ok: false, error: 'Missing env vars', GMAIL_USER: user ?? 'MISSING', GMAIL_APP_PASSWORD: pass ? `${pass.length} chars` : 'MISSING' })
    }
    try {
      const t = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 587, secure: false, auth: { user, pass } })
      await t.sendMail({ from: `"innogarage.ai" <${user}>`, to: user, subject: 'Railway email test', text: 'Railway SMTP is working.' })
      return { ok: true, GMAIL_USER: user, GMAIL_APP_PASSWORD: `${pass.length} chars` }
    } catch (err: unknown) {
      return reply.send({ ok: false, error: (err as Error).message, GMAIL_USER: user, GMAIL_APP_PASSWORD: `${pass.length} chars` })
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
