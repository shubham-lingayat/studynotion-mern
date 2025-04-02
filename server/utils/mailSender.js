const nodemailer = require("nodemailer");


const mailSender = async (email, title, body) => {
  try {
    let transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: 465, // Use 465 for secure SSL/TLS, or 587 for STARTTLS
      secure: true, // True for 465, false for 587
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, // Bypass SSL certificate validation
      },
    });

    let info = await transporter.sendMail({
      from: "StudyNotion || Shubham Lingayat",
      to: `${email}`,
      subject: `${title}`,
      html: `${body}`,
    });

    console.log("Email sent:", info);
    return info;
  } catch (err) {
    console.error("Mail sending failed:", err.message);
    return null; // Return null instead of undefined
  }
};

module.exports = mailSender;
