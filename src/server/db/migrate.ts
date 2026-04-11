import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { migrate } from 'drizzle-orm/neon-http/migrator'
import { config } from 'dotenv'

config()

async function runMigrations(): Promise<void> {
  const sql = neon(process.env.DATABASE_URL!)
  const db = drizzle(sql)
  console.log('Running migrations...')
  await migrate(db, { migrationsFolder: './drizzle' })
  console.log('Migrations complete!')
}

runMigrations().catch(console.error)
