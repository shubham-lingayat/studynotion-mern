const Course = require("../models/Course");
const categories = require("../models/Categories");
const User = require("../models/User");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

// createCourse Handler
exports.createCourse = async (req, res) => {
  try {
    // Get user ID from request object
    const userId = req.user.id;

    // Data fetch from request body
    const {
      courseName,
      courseDecsription,
      whatYouWillLearn,
      price,
      tag,
      status,
      instructions,
      category,
    } = req.body;

    // file fetch
    const thumbnail = req.files.thumbnailImage;
    // data validation
    if (
      !courseName ||
      !courseDecsription ||
      !whatYouWillLearn ||
      !price ||
      !category ||
      !thumbnail ||
      !tag
    ) {
      return res.status(401).json({
        success: false,
        message: "All fields are mandetory to fill",
      });
    }

    if (!status || status === undefined) {
      status = "Draft";
    }

    // Check if the user is an instructor
    const instructorDetails = await User.findById(userId, {
      accountType: "Instructor",
    });

    if (!instructorDetails) {
      return res.status(404).json({
        success: false,
        message: "Instructor Details Not Found",
      });
    }

    // category validation
    const categoryDetails = await categories.findById(category);
    if (!categoryDetails) {
      return res.status(404).json({
        success: false,
        message: "category details not found",
      });
    }
    // thumbnail image upload to cloudinary
    const thumbnailImageURL = await uploadImageToCloudinary(
      thumbnail,
      process.env.FOLDER_NAME
    );
    // create course entry in DB
    const newCourse = await Course.create({
      courseName,
      courseDescription,
      instructor: instructorDetails._id,
      whatYouWillLearn: whatYouWillLearn,
      price,
      tag: tag,
      category: categoryDetails._id,
      thumbnail: thumbnailImageURL.secure_url,
      status: status,
      instructions: instructions,
    });

    // create course entry in User Schema - For Instructor
    await User.findByIdAndUpdate(
      { _id: instructorDetails._id },
      {
        $push: {
          courses: newCourse._id,
        },
      },
      { new: true }
    );
    // create course entry in category
    await categories.findByIdAndUpdate(
      { _id: categoryDetails._id },
      {
        $push: {
          course: newCourse._id,
        },
      },
      { new: true }
    );
    // return resposne
    return res.status(200).json({
      success: true,
      message: "Course Created Successfully",
    });
  } catch (err) {
    console.log(err);
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error, can not create Course",
    });
  }
};

// get All courses handler -----------------------------
exports.showAllCourses = async (req, res) => {
  try {
    // find all courses from DB
    // const allCourses = await Course.find({});
    const allCourses = await Course.find(
      {},
      {
        courseName: true,
        price: true,
        thumbnail: true,
        instructor: true,
        ratingAndReview: true,
        studentsEnrolled: true,
      }
    )
      .populate("instructor")
      .exec();

    // return response
    return res.status(200).json({
      success: true,
      message: "All the Courses fetched successfully",
      data: allCourses,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error, Not able to fetch all data",
    });
  }
};

// get courseDetails
exports.getCourseDetails = async (req, res) => {
  try {
    // get id
    const { courseId } = req.body;
    // find course details
    const courseDetails = await Course.find({ _id: courseId })
      .populate({
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      })
      .populate("category")
      .populate("ratingAndReview")
      .populate({
        path: "courseContent",
        populate: {
          path: "SubSection",
        },
      })
      .exec();

    // validation of data
    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find the course with ${courseId}`,
      });
    }

    // return response
    return res.status(200).json({
      success: true,
      message: "Course Details fetched successfully",
      data: courseDetails,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
