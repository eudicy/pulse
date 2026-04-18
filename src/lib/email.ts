import nodemailer from 'nodemailer'

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  const { to, subject, html } = opts

  if (process.env.RESEND_API_KEY) {
    // Lazy import so Resend is only loaded in production paths
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'noreply@example.com',
      to,
      subject,
      html,
    })
    if (error) {
      throw new Error(`Resend error: ${error.message}`)
    }
    return
  }

  // Development: use nodemailer with Mailpit (or any SMTP)
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST ?? 'localhost',
    port: Number(process.env.EMAIL_SERVER_PORT ?? 1025),
    secure: false,
    auth:
      process.env.EMAIL_SERVER_USER
        ? {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD ?? '',
          }
        : undefined,
  })

  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? 'noreply@example.com',
    to,
    subject,
    html,
  })
}
