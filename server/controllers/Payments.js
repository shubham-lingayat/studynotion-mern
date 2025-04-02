const { default: mongoose } = require("mongoose");
const { instance } = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const {
  courseEnrollmentEmail,
} = require("../mail/templates/courseEnrollmentEmail");

// Capture the Payment and initiate the Razorpay Order
exports.capturePayment = async (req, res) => {
  try {
    // get courseId and UserId
    const { course_id } = req.body;
    const userId = req.user.id;
    // Validation
    // Valid CourseId
    if (!course_id) {
      return res.status(401).json({
        success: false,
        message: "Course id is not given",
      });
    }
    // valid courseDetails
    let course;
    course = await Course.findById(course_id);
    if (!course) {
      return res.status(401).json({
        success: false,
        message: "Could not find the course",
      });
    }
    // check whether user already pay for the same course
    // converting sting type 'userId' to Object Type 'user_id'
    const user_id = new mongoose.Types.ObjectId(userId);
    if (course.studentsEnrolled.includes(user_id)) {
      return res.status(400).json({
        success: false,
        message: "Student is already exists",
      });
    }
    // order create
    const amount = course.price;
    const currency = "INR";

    const options = {
      amount: amount * 100,
      currency,
      receipt: Math.random(Date.now()).toString(),
      notes: {
        courseId: course_id,
        userId,
      },
    };

    // Initiate the payment using Razorpay
    const paymentResponse = await instance.orders.create(options);
    console.log(paymentResponse);
    // return response
    return res.status(200).json({
      success: true,
      message: "Payment is successed",
      payment: paymentResponse,
      courseName: course.courseName,
      courseDescription: course.courseDescription,
      thumbnail: course.thumbnail,
      orderId: paymentResponse.id,
      currency: paymentResponse.currency,
      amount: paymentResponse.amount,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Verify Signature - verify payment is done or not by matching key
exports.verifySignature = async (req, res) => {
  try {
    // my signature on my server
    const webhookSecret = "12345678";
    // razorpay signature present in header as an key (key value pair)
    const Signature = req.headers["x-razorpay-signature"];

    // create Hash mac of my signature key - to make it encrypted for matching with razorpay
    const shasum = crypto.createHmac("sha256", webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    // if razorpay signature is matched with my server encrypted signature
    if (signature !== digest) {
      return res.status(400).json({
        success: false,
        message: "Payment is not authorized, secret key not matched",
      });
    }

    console.log("Payment is Authorized");

    // Enroll the student in course -
    // add course deatils in user and user details in course

    // fetch data from req.body
    const { courseId, userId } = req.body.payload.payment.entity.notes;

    // validation

    // fulfil the action

    // find the course and enroll the student
    const enrolledCourse = await Course.findByIdAndUpdate(
      { _id: courseId },
      {
        $push: {
          studentsEnrolled: userId,
        },
      },
      { new: true }
    );

    if (!enrolledCourse) {
      return res.status(400).json({
        success: false,
        message: "Course not found",
      });
    }

    // find the student and update the coure details into student courses
    const enrolledStudent = await User.findByIdAndUpdate(
      { _id: userId },
      {
        $push: {
          courses: courseId,
        },
      },
      { new: true }
    );

    console.log(enrolledStudent);

    // confirmation mail send to student
    const emailResponse = await mailSender(
      enrolledStudent.email,
      "Congratulations from CodeHelp",
      "Congratulations, you are onboarded into new Codehelp Course"
    );

    console.log(emailResponse);
    // return response
    return res.status(200).json({
      success: true,
      message: "Studnet is enrolled to course successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
