const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerificationTemplate");

const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    expires: 5 * 60,
  },
});

// must written before module export
// a Function -> to send Mails
  async function sendVerificationEmail(email, otp) {
    // Create a transporter to send emails
    // Define the email options
    // Send the email
    try {
      const mailResponse = await mailSender(
        email,
        "Verification Email From StudyNotion",
        emailTemplate(otp)
      );
  
      if (!mailResponse) {
        throw new Error("Mail sending failed, received null response.");
      }
  
      console.log("Email Sent Successfully!", mailResponse.response);
    } catch (error) {
      console.error("Error occurred when sending mail:", error);
      throw error;
    }
  }

// Define a post-save hook to send email after the document has been saved
OTPSchema.pre("save", async function (next) {
  console.log("New document saved to database");

  // Only send an email when a new document is created
  if (this.isNew) {
    await sendVerificationEmail(this.email, this.otp);
  }
  next();
});

module.exports = mongoose.model("OTP", OTPSchema);
