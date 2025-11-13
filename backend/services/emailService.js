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
    /*
      Лінк для підтвердження емейлу формуються так, щоб потрапляти
      на існуючий бекенд-рут `/api/auth/confirm-email`. Раніше посилання вели на
      `/confirm-email` і викликали 404.
    */
    const host = process.env.HOST_FOR_EMAIL || process.env.HOST || 'localhost';
    const port = process.env.PORT_FOR_EMAIL || process.env.PORT || '3000';
    const url = `http://${host}:${port}/api/auth/confirm-email?token=${token}`;
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
}

export default EmailService;
