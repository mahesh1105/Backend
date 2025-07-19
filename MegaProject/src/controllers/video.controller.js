import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

// Controller to get all the videos based on query, sort and pagination
const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
})

// Controller to publish the video
const publishAVideo = asyncHandler(async (req, res) => {
  // Fetch the title and description from req.body
  const { title, description } = req.body;

  // Check if title or description is missing
  if([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "Title or Description is missing!!!");
  }

  // Fetch the user id from req.user
  const userId = req.user?._id;

  // Get the video file path
  const videoLocalPath = req.files?.videoFile[0]?.path;

  // Get the thumbnail file path
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  // Check if the video local path is there or not
  if(!videoLocalPath) {
    throw new ApiError(400, "Video file is missing");
  }

  // Check if the thumbnail local path is there or not
  if(!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail file is missing");
  }

  // Upload the video and thumbnail on cloudinary
  const video = await uploadOnCloudinary(videoLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  // Check if video file uploaded sucessfully
  if(!video) {
    throw new ApiError(400, "Video file uploading failed");
  }

  // Check if thumbnail file uploaded sucessfully
  if(!thumbnail) {
    throw new ApiError(400, "Thumbnail file uploading failed")
  }

  // Save the data in DB
  const videoFile = await Video.create({
    videoFile: video.url,
    thumbnail: thumbnail.url,
    title,
    description,
    duration: video.duration,
    owner: userId
  });

  // Check if video document sucessfully stored in DB
  if(!videoFile) {
    throw new ApiError(400, "Error while publishing the video");
  }

  // Return the response
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    videoFile,
    "Video File published successfully"
  ));
})

// Controller to get the video by Id
const getVideoById = asyncHandler(async (req, res) => {
  // Fetch the video id from the URL path
  const { videoId } = req.params;

  // Check if video id is valid or not
  if(!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  // Fetch the video info from the DB
  const video = await Video.findById(videoId);

  // Check if video file already exists or not in DB
  if(!video) {
    throw new ApiError("Invalid video id - Video not found");
  }

  // Send the response
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    video,
    "Video file fetched successfully"
  ));
})

// Controller to update the video details like - title, description and thumbnail
const updateVideo = asyncHandler(async (req, res) => {
  // Fetch the video id from the URL path
  const { videoId } = req.params;

  // Check if the video id is in proper format
  if(!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id format");
  }

  // Get the video details from DB using the video id
  const videoDetails = await Video.findById({
    _id: videoId
  });

  // Check if the video is present or not
  if(!videoDetails) {
    throw new ApiError(400, "Invalid Video Id - video doesn't exists");
  }

  // Fetch the current logged in used id
  const loggedInUser = req.user?._id;

  if(loggedInUser.toString() !== videoDetails?.owner.toString()) {
    throw new ApiError(400, "User must be the owner of video in order to update its details");
  }

  // Fetch the title and description from req.body
  const title = req.body?.title;
  const description = req.body?.description;

  // Fetch the thumbnail from the req.file
  const thumbnailLocalPath = req.file.path;

  // Check if any of the field is not present
  if([title, description, thumbnailLocalPath].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "Must provide all the required fields in order to update the video details");
  }

  // Upload the latest thumbnail on cloudinary
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  // Check if thumbnail is uploaded successfully
  if(!thumbnail) {
    throw new ApiError(400, "Thumbnail uploading failed");
  }

  // Update the video details
  const updatedVideoInfo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: thumbnail.url
      }
    },
    { new: true }
  );

  // Return the response
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    updatedVideoInfo,
    "Video details updated successfully"
  ));
})

// Controller to delete the video
const deleteVideo = asyncHandler(async (req, res) => {
  // Fetch the video id from the URL path
  const { videoId } = req.params;

  // Check if the video id is in valid format
  if(!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id format");
  }

  // Get the current logged in user id
  const loggedInUser = req.user?._id;

  // Find the video info using the video id
  const video = await Video.findById({
    _id: videoId
  });

  // Check if the video exists or not
  if(!video) {
    throw new ApiError(400, "Invalid Video Id - No Such video exists");
  }

  // Check if the current user is logged in user in order to delete the video
  if(loggedInUser.toString() !== video.owner.toString()) {
    throw new ApiError(400, "User must be the owner in order to delete the video");
  }

  // Delete the video in DB
  const deletedVideo = await Video.findByIdAndDelete({
    _id: videoId
  })

  // Check if the video is successfully deleted or not
  if(!deletedVideo) {
    throw new ApiError(400, "Error while deleting the video");
  }

  // Return the response
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    deletedVideo,
    "Video deleted successfully"
  ));
})

// Controller to toggle the video publish status
const togglePublishStatus = asyncHandler(async (req, res) => {
  // Fetch the video id from the URL path
  const { videoId } = req.params;

  // Fetch the user id from req.user object
  const userId = req.user?._id;

  // Check if the video id is valid
  if(!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id format");
  }

  // Find the video id in DB
  const video = await Video.findOne({
    _id: videoId
  });

  // Check if video found in DB or not
  if(!video) {
    throw new ApiError(404, "Invalid Video Id - video not found");
  }

  // Check if user is the owner of the video
  if(video.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "User must be the owner in order to modify the video status");
  }

  // Toggle the video publish status
  const modifyVideoPublishStatus = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video.isPublished,
      },
    },
    { new: true } 
  )

  // Send the response
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    modifyVideoPublishStatus,
    "Video pusblish status toggled successfully"
  ));
})

export { getAllVideos, publishAVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus };

/*
  Explanation:
  ------------
  upload.single("thumbnail") - stores the single uploaded file in 'req.file'
  upload.fields([{name: "thumbnail", maxCount: 1}]) - would store files in 'req.files.thumbnail'
  upload.array("thumbnail") - would store files in 'req.files' as an array

Since you're using .single(), the file object is directly available on req.file with properties like path, filename, originalname, etc.
*/