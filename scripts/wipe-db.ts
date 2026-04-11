import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
dotenv.config()

async function main(): Promise<void> {
  const sql = neon(process.env.DATABASE_URL!)
  await sql`TRUNCATE plans, profiles, users RESTART IDENTITY CASCADE`
  console.log('All user data deleted.')
}

main().catch(console.error)
