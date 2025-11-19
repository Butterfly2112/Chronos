import nodemailer from "nodemailer";

class EmailService {
  constructor() {
    console.log(process.env.EMAIL_USER, process.env.EMAIL_PASS);
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  async sendEmailConfirmationToken(email, token) {
    const url = `http://${process.env.HOST_FOR_EMAIL}:${process.env.PORT_FOR_EMAIL}/confirm-email?token=${token}`;
    const info = await this.transporter.sendMail({
      from: `"Chronos" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Registration confirmation",
      text: `To confirm your registration, follow the link: ${url}`,
      html: `
        <h1>Welcome to the Chronos</h1>
        <p>Please, confirm your email by clicking on the link below</p>
        <a href="${url}">${url}</a>
      `,
    });
    console.log("Message sent: %s", info.messageId);
  }
  async sendPasswordResetToken(email, token) {
    const protocol = process.env.FRONTEND_PROTOCOL || 'http'
    const host = process.env.FRONTEND_HOST || process.env.HOST_FOR_EMAIL || process.env.HOST || 'localhost'
    const port = process.env.FRONTEND_PORT || '3001'
    const portPart = port ? `:${port}` : ''
    const url = `${protocol}://${host}${portPart}/reset-password?token=${token}`
    const info = await this.transporter.sendMail({
      from: `"Chronos" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset",
      text: `To reset your password, follow the link: ${url}`,
      html: `
        <h1>Password Reset Request</h1>
        <p>Please, reset your password by clicking on the link below</p>
        <a href="${url}">${url}</a>
      `,
    });
    console.log("Message sent: %s", info.messageId);
  }
}

export default EmailService;
