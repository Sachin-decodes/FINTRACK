import nodemailer from 'nodemailer';

export async function sendPasswordResetEmail({ recipient, name, resetUrl }) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) throw Object.assign(new Error('Email service is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.'), { statusCode: 503 });
  const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: false, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
  await transport.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to: recipient, subject: 'Reset your FinTrack password', text: `Hello ${name},\n\nUse this link to reset your FinTrack password. It expires in 15 minutes:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`, html: `<p>Hello ${name},</p><p>Use this link to reset your FinTrack password. It expires in <strong>15 minutes</strong>.</p><p><a href="${resetUrl}">Reset my password</a></p><p>If you did not request this, you can ignore this email.</p>` });
}
