const RatingAndReview = require("../models/RatingAndReviews");
const Course = require("../models/Course");

// create Rating
exports.createRating = async (req, res) => {
  try {
    // get user id
    const userId = req.user.id;

    // fetch data from user body
    const { rating, review, courseId } = req.body;

    // check if user is enrolled or not
    const courseDetails = await Course.findOne({
      _id: courseId,
      studentsEnrolled: { $elemMtach: { $eq: userId } },
    });

    if (!courseDetails) {
      return res.status(404).json({
        success: false,
        message: "User is not enrolled in course",
      });
    }

    // check if review is already exists by the same user
    const alreadyReviewd = await RatingAndReview.findOne({
      user: userId,
      course: courseId,
    });

    // create Rating and Review
    if (alreadyReviewd) {
      return res.status(403).json({
        success: false,
        message: "User Review alredy exists",
      });
    }

    // Update Course with this review
    const ratingAndReview = await RatingAndReview.create({
      rating,
      review,
      course: courseId,
      user: userId,
    });

    // Update the course with the rating and review
    await Course.findByIdAndUpdate(
      { _id: courseId },
      {
        $push: {
          ratingAndReview: ratingAndReview._id,
        },
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Review is created successfully",
      data: ratingAndReview,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// get Average Rating
exports.getAverageRating = async (req, res) => {
  try {
    // Get Course Id
    const courseId = req.body.courseId;
    // Calculate average rating
    const result = await RatingAndReview.aggregate([
      {
        $match: {
          // courseId is present in string convert to object id
          course: new mongoose.Types.ObjectId(courseId),
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
        },
      },
    ]);

    // return rating
    if (result.length > 0) {
      return res.status(200).json({
        success: true,
        averageRating: result[0].averageRating,
      });
    }

    // if no rating/review exists
    return res.status(200).json({
      success: true,
      message: "Average Rating is 0, no ratings given till now",
      averageRating: 0,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// get All rating & Reviews
exports.getAllRating = async (req, res) => {
  try {
    const allReviews = await RatingAndReview.find({})
      .sort({ rating: "desc" })
      .populate({
        path: "user",
        select: "firstName lastName email image",
      })
      .populate({
        path: "course",
        select: "courseName",
      })
      .exec();

    // return response
    return res.status(200).json({
      success: true,
      message: "All details fetched successfully",
      data: allReviews,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
