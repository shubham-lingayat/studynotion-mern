// CRUD Operations performed by Instructor
const Section = require("../models/Section");
const Course = require("../models/Course");
const subSection = require('../models/subSection');

exports.createSection = async (req, res) => {
  try {
    // data fetch
    const { sectionName, courseId } = req.body;
    // data validation
    if (!sectionName || !courseId) {
      return res.status(401).json({
        success: false,
        message: "Missing Properties",
      });
    }
    // create section
    const newSection = await Section.create({ sectionName });
    // update course with section ObjectId
    // use populate to replace sections and sub-sections both in the updated updatedCourseDetails
    const updatedCourseDetails = await Course.findByIdAndUpdate(
      courseId,
      {
        $push: {
          courseContent: newSection._id,
        },
      },
      { new: true }
    )
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
          model: "subSection",
        },
      })
      .exec();

    console.log(updatedCourseDetails);

    // return response
    return res.status(200).json({
      success: true,
      message: "Section created successfully",
      updatedCourseDetails,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error, can not create Section",
      error: err.message,
    });
  }
};

// Course Update Handler
exports.updateSection = async (req, res) => {
  try {
    // data input
    const { sectionName, sectionId } = req.body;
    // data validation
    if (!sectionName || !sectionId) {
      return res.status(400).json({
        success: false,
        message: "Missing Properties",
      });
    }
    // data update in DB
    const section = await Section.findByIdAndUpdate(
      sectionId,
      { sectionName },
      { new: true }
    );
    // return response
    return res.status(200).json({
      success: true,
      message: "Section Updated Successfully",
      section,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error, Can not update Course",
    });
  }
};

// delete Section Handler
exports.deleteSection = async (req, res) => {
  try {
    // get Id from req.body
    const { sectionId, courseId } = req.body;
    // find id and delete
    const deletedSection = await Section.findByIdAndDelete(sectionId);

    if (!deletedSection) {
      return res.status(400).json({
        success:false,
        message:"Section not found"
      })
    }

     // Remove the section reference from the course
     const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { $pull: { courseContent: sectionId } }, // Remove section from courseContent array
      { new: true } // Return updated document
    ).populate({
      path: "courseContent",
      populate: {
        path: "subSection",
      },
    });

    // return response
    return res.status(200).json({
      success: true,
      message: "Section Deleted Successfully",
      data: updatedCourse
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Unable to delete Section, please try again",
      error: err.message,
    });
  }
};
