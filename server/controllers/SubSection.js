const SubSection = require("../models/subSection");
const Section = require("../models/Section");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

// Create Section Handler
exports.createSubSection = async (req, res) => {
  try {
    // fetch data from request body
    const { sectionId, title, timeDuration, description } = req.body;
    // extract video from request file
    const videoFile = req.files.videoFile;
    // validation
    if (!sectionId || !title || !timeDuration || !description || !videoFile) {
      return res.status(401).json({
        success: false,
        message: "All fields requied",
      });
    }
    // upload video to cloudinary
    const uploadFileUrl = await uploadImageToCloudinary(
      videoFile,
      process.env.FOLDER_NAME
    );
    // create entry in sub-section
    const SubSectionDetails = await SubSection.create({
      title: title,
      timeDuration: timeDuration,
      description: description,
      videoUrl: uploadFileUrl.secure_url,
    });
    // update section with this sub section Object Id
    const sectionUpdate = await Section.findByIdAndUpdate(
      { _id: sectionId },
      {
        $push: {
          subSection: SubSectionDetails._id,
        },
      },
      { new: true }
    ).populate("subSection");
    // Log Update Section here after adding Populate query
    console.log(sectionUpdate);
    // return response
    return res.status(200).json({
      success: true,
      message: "Sub Section created successfully",
      sectionUpdate,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error, when creating sub section",
    });
  }
};

// Update Sub Section Handler
exports.updateSubSection = async (req, res) => {
  try {
    // fetch data from request body
    const { sectionId, title, timeDuration, description, subSectionId } =
      req.body;
    // extract video from request file
    const videoFile = req.files.videoFile;
    // validation
    if (
      !sectionId ||
      !title ||
      !timeDuration ||
      !description ||
      !videoFile ||
      !subSectionId
    ) {
      return res.status(401).json({
        success: false,
        message: "All fields requied",
      });
    }
    // upload video to cloudinary
    const uploadFileUrl = await uploadImageToCloudinary(
      videoFile,
      process.env.FOLDER_NAME
    );
    // create entry in sub-section
    const SubSectionDetails = await SubSection.findByIdAndUpdate(
      { _id: subSectionId },
      {
        title: title,
        timeDuration: timeDuration,
        description: description,
        videoUrl: uploadFileUrl.secure_url,
      }
    );
    // update section with this sub section Object Id
    const sectionUpdate = await Section.findByIdAndUpdate(
      { _id: sectionId },
      {
        $push: {
          subSection: SubSectionDetails._id,
        },
      },
      { new: true }
    ).populate();
    // Log Update Section here after adding Populate query
    console.log(sectionUpdate);
    // return response
    return res.status(200).json({
      success: true,
      message: "Sub Section created successfully",
      sectionUpdate,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error, when creating sub section",
    });
  }
};

// Delete Sub Section Handler
exports.deleteSubSection = async (req, res) => {
  try {
    // fetch data from request body
    const { sectionId, subSectionId } = req.body;
    // validation
    if (!sectionId || !subSectionId) {
      return res.status(401).json({
        success: false,
        message: "All fields requied",
      });
    }


    // delete subsection id from section
    const sectionUpdate = await Section.findByIdAndUpdate(
      { _id: sectionId },
      {
        $pull: {
          subSection: subSectionId,
        },
      },
      { new: true }
    ).populate();

    
      // delete entry in sub-section
      const SubSectionDetails = await SubSection.findByIdAndDelete({
        _id: subSectionId,
      });

    // return response
    return res.status(200).json({
      success: true,
      message: "Sub Section deleted successfully",
      data: sectionUpdate
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error, when deleting sub section",
    });
  }
};
