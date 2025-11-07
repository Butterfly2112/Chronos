import nodemailer from "nodemailer";

class EmailService {
  constructor() {
    this.transponter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  async sendEmailConfirmationToken(email, token) {
    const url = `http://${process.env.HOST_FOR_EMAIL}:${process.env.PORT_FOR_EMAIL}/confirm-email?token=${token}`;
    const info = await this.transponter.sendMail({
      from: `"Chronus" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Registration confirmation",
      text: `To confirm your registration, follow the link: ${url}`,
      html: `
        <h1>Welcome to the Chronus</h1>
        <p>Please, confirm your email by clicking on the link below</p>
        <a href="${url}">${url}</a>
      `,
    });
    console.log("Message sent: %s", info.messageId);
  }
}

export default EmailService;
