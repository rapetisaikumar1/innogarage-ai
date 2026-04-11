import nodemailer from 'nodemailer'
import * as dotenv from 'dotenv'
dotenv.config()

async function main(): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  })

  const result = await transporter.sendMail({
    from: `"innogarage.ai" <${process.env.GMAIL_USER}>`,
    to: 'rapetisaikumar7@gmail.com',
    subject: 'Test OTP from innogarage.ai',
    html: '<p>Your test code is: <strong>123456</strong></p>'
  })

  console.log('Sent:', result.messageId)
}

main().catch(console.error)

