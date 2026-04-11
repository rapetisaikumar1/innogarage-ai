import { FastifyInstance, FastifyRequest } from 'fastify'
import { eq, and, gt } from 'drizzle-orm'
import { getDb } from '../db'
import { plans } from '../db/schema'
import { authMiddleware } from '../middleware/auth'

interface AuthRequest extends FastifyRequest {
  user: { userId: string; email: string }
}

const PLAN_CONFIG = {
  daily: { price: '10.00', days: 1, label: '1 Day' },
  weekly: { price: '50.00', days: 7, label: '1 Week' },
  monthly: { price: '150.00', days: 30, label: '1 Month' }
} as const

export async function planRoutes(app: FastifyInstance): Promise<void> {
  // Get available plans
  app.get('/plans', async () => {
    return {
      plans: Object.entries(PLAN_CONFIG).map(([key, config]) => ({
        type: key,
        price: config.price,
        duration: config.label
      }))
    }
  })

  // Subscribe to a plan (no payment gateway — mock)
  app.post('/plans/subscribe', { preHandler: authMiddleware }, async (request, reply) => {
    const { userId } = (request as AuthRequest).user
    const { planType } = request.body as { planType: 'daily' | 'weekly' | 'monthly' }

    const config = PLAN_CONFIG[planType]
    if (!config) {
      return reply.code(400).send({ error: 'Invalid plan type' })
    }

    // Deactivate any existing active plans
    await getDb()
      .update(plans)
      .set({ isActive: false })
      .where(and(eq(plans.userId, userId), eq(plans.isActive, true)))

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + config.days)

    const [plan] = await getDb()
      .insert(plans)
      .values({
        userId,
        planType,
        price: config.price,
        expiresAt
      })
      .returning()

    return { plan }
  })

  // Get active plan
  app.get('/plans/active', { preHandler: authMiddleware }, async (request) => {
    const { userId } = (request as AuthRequest).user

    const [activePlan] = await getDb()
      .select()
      .from(plans)
      .where(
        and(eq(plans.userId, userId), eq(plans.isActive, true), gt(plans.expiresAt, new Date()))
      )
      .limit(1)

    return { plan: activePlan || null }
  })
}
