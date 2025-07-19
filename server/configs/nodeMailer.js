import nodemailer from 'nodemailer';

// Create a transporter for SMTP
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((err, success) => {
  if (err) {
    console.error("SMTP Connection Error:", err);
  } else {
    console.log("SMTP Server is ready to send emails");
  }
});

const sendEmail = async ({ to , subject, body}) => {

   console.log("📤 Attempting to send email...");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("From:", process.env.SENDER_EMAIL);
    
    const response = await transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to,
        subject,
        html: body,
    })
    return response
}

export default sendEmail;