const Profile = require("../models/Profile");
const User = require("../models/User");
const {uploadImageToCloudinary} = require('../utils/imageUploader');

exports.updateProfile = async (req, res) => {
  try {
    // get data
    const { dataOfBirth = "", about = "", contactNumber, gender } = req.body;
    // get userId
    const id = req.user.id;
    // validation
    if (!contactNumber || !gender || !id) {
      return res.status(401).json({
        success: true,
        message: "All fields are mandetory",
      });
    }
    // find Profile
    // profile id is mentioned inside user -> additional details id == profile id
    const userDetails = await User.findById(id);
    const profileId = userDetails.additionalDetails;
    const profileDetails = await Profile.findById(profileId);
    // Update Profile - Data in DB
    // Reason - Object is already defined (i.e. DB already contains null data for the following that's why we no need to use create method of mongoDB)
    profileDetails.dateOfBirth = dataOfBirth;
    profileDetails.about = about;
    profileDetails.gender = gender;
    profileDetails.contactNumber = contactNumber;
    await profileDetails.save();
    // return response
    return res.status(200).json({
      success: true,
      message: "Profile Details Updated Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error, while Creating Profile",
    });
  }
};

// delete Account
exports.deleteAccount = async (req, res) => {
  try {
    // TODO: Find More on Job Schedule
    // const job = schedule.scheduleJob("10 * * * * *", function () {
    // 	console.log("The answer to life, the universe, and everything!");
    // });
    // console.log(job);
    // get Id
    const id = req.user.id;

    const userDetails = await User.findById({ _id: id });
    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }
    // Delete Profile of User - First we delete Profile then delete User
    await Profile.findByIdAndDelete({ _id: userDetails.additionalDetails });

    // TODO: Unenroll user from all enrolled courses
    // Delete User
    await User.findByIdAndDelete({ _id: id });

    // return response
    return res.status(200).json({
      success: true,
      message: "Account Deleted Successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// get All User details
exports.getAllUserDetails = async (req, res) => {
  try {
    // get id
    const id = req.user.id;
    // userdetails -> populate additional Details of user (profile details)
    userDetails = await User.findById(id).populate("additionalDetails").exec();
    // validation
    if (!userDetails) {
      return res.status(401).json({
        success: false,
        message: "User Not Found",
      });
    }
    // return response
    return res.status(200).json({
      success: true,
      message: "User details fetched successfully",
      data:userDetails
    });
  } catch (err) {
    console.error(err);
    return res.status.json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.updateDisplayPicture = async (req, res) => {
  try {
    const displayPicture = req.files.displayPicture;
    const userId = req.user.id;
    const image = await uploadImageToCloudinary(
      displayPicture,
      process.env.FOLDER_NAME,
      1000,
      1000
    );
    console.log(image);
    const updatedProfile = await User.findByIdAndUpdate(
      { _id: userId },
      { image: image.secure_url },
      { new: true }
    );
    res.send({
      success: true,
      message: `Image Updated successfully`,
      data: updatedProfile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const userDetails = await User.findOne({
      _id: userId,
    })
      .populate("courses")
      .exec();
    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find user with id: ${userDetails}`,
      });
    }
    return res.status(200).json({
      success: true,
      data: userDetails.courses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
