import nodemailer from "nodemailer";

class EmailService {
  #protocol = process.env.FRONTEND_PROTOCOL || "http";
  #host =
    process.env.FRONTEND_HOST ||
    process.env.HOST_FOR_EMAIL ||
    process.env.HOST ||
    "localhost";
  #port = process.env.FRONTEND_PORT || "3001";
  #portPart = this.#port ? `:${this.#port}` : "";

  constructor() {
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
    const url = `${this.#protocol}://${this.#host}${
      this.#portPart
    }/reset-password?token=${token}`;
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

  async shareCallendarMessage(email, calendar, ownerName) {
    const calendarUrl = `${this.#protocol}://${this.#host}${
      this.#portPart
    }/calendars/${calendar._id}`;

    const info = await this.transporter.sendMail({
      from: `"Chronos" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `${ownerName} has shared a calendar with you`,
      text: `${ownerName} has shared their calendar "${calendar.name}" with you. Open Chronos to view it: ${calendarUrl}`,
      html: `
             <h1>Calendar Shared with You</h1>
              <p>${ownerName} has shared their calendar "<strong>${calendar.name}</strong>" with you.</p>
              <p>Click the link below to view it:</p>
              <a href="${calendarUrl}">${calendarUrl}</a> 
            `,
    });

    console.log("Calendar share message sent: %s", info.messageId);
  }
}

export default EmailService;
