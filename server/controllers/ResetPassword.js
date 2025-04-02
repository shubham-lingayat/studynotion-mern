const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");

// Reset Password Token
exports.resetPasswordToken = async (req, res) => {
  try {
    // Get email from req body
    const email = req.body.email;
    // check user for this email, email validation
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: `This Email: ${email} is not Registered With Us Enter a Valid Email `,
      });
    }
    // generate token- using built-in function
    const token = crypto.randomBytes(20).toString("hex");
    // update user by adding token and expiretion time
    const updatedDetails = await User.findOneAndUpdate(
      { email: email },
      {
        token: token,
        resetPasswordExpires: Date.now() + 3600000,
      },
      { new: true }
    );

    console.log("DEATILS: ", updatedDetails);
    // create url
    const url = `http://localhost:3000/update-password/${token}`;

    // send mail containing the url
    await mailSender(
      email,
      "Password Reset Link",
      `Your Link for email verification is ${url}. Please click this url to reset your password.`
    );
    // return response
    return res.status(200).json({
      success: true,
      message: "Paasword reset mail sended successfully!",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while reseting password",
    });
  }
};

// Reset password After user click on LINK received in mail
exports.resetPassword = async (req, res) => {
  try {
    // data fetch from req.body
    const { password, confirmPassword, token } = req.body;
    // get the token
    // Validation
    if (password !== confirmPassword) {
      return res.status(401).status({
        success: false,
        message: "Password and Confirm Password not matched",
      });
    }
    // Get the user details using Token from database
    const userDetails = await User.findOne({ token: token });
    // If user not found return
    if (!userDetails) {
      return res.status(401).json({
        success: false,
        message: "Token is invalid",
      });
    }
    // Token time check if it is expired
    if (userDetails.resetPasswordExpires < Date.now()) {
      return res.json({
        success: false,
        message: "Token is expired, please regenerate your token",
      });
    }

    // hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Make entry in DB for the new password
    await User.findOneAndUpdate(
      { token: token },
      { password: hashedPassword },
      { new: true }
    );
    // return response
    return res.status(200).json({
      success: true,
      message: "Password Reset Successful",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error, not able to reset password",
    });
  }
};
