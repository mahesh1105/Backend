import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// Function to toggle like on the Video
const toggleVideoLike = asyncHandler(async (req, res) => {
  // Get the videoId from the params - website link
  const { videoId } = req.params;

  console.log(videoId);
  console.log(typeof videoId); // string

  // Fetch the userId from the req.user object
  const userId = req.user?._id;

  console.log(userId);
  console.log(typeof userId); // object

  // Check if the videoId is valid or not
  /*
    It verifies that:

    The ID is a 24-character hexadecimal string
    👉 Meaning: only contains 0-9 and a-f

    OR it's an instance of ObjectId
  */
  if(!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }
  
  // Find the videoId and userId in DB - if exists it means that
  // user with userId has liked the video with that videoId
  // Search using both - chances can be there some other user has also liked the video
  const existingLike = await Like.findOne({
    video: videoId,  // Type Conversion from string to ObjectId
    likedBy: userId
  });

  console.log(existingLike);
  console.log(typeof existingLike); // object

  // Check if the video is already liked by the user
  if(existingLike) {
    // Delete the document which will remove it from liked videos
    // existingLike._id --> Object (serach for the object id)
    await Like.findByIdAndDelete(existingLike._id);

    // Return the response
    return res
    .status(200)
    .json(new ApiResponse(
      200,
      existingLike,
      "Video unliked successfully"
    ));
  }

  // If video is not already liked by the user then create
  // i.e. if video is not liked then like the video
  const likeVideo = await Like.create({
    video: videoId,
    likedBy: userId
  });

  // Return the Response
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    likeVideo,
    "Video liked successfully"
  ));
})

// Function to toggle like on the Comment
const toggleCommentLike = asyncHandler(async (req, res) => {
  // Fetch the commentId from the URL - route parameters parsed from URL path
  const { commentId } = req.params;

  // Fetch the userId from the req.user object
  const userId = req.user?._id;

  // Check if the commentId is valid or not
  if(!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment ID")
  }

  // Find the occurence of document (already liked comment)
  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: userId
  });

  // Check if the comment is already liked
  if(existingLike) {
    // Delete the document - remove like on the comment
    await Like.findByIdAndDelete(existingLike._id);

    // Return the response
    return res
    .status(200)
    .json(new ApiResponse(
      200,
      existingLike,
      "Comment unliked successfully"
    ))
  }

  // If Document is not found - that means comment is not liked
  // Create the new document - like the comment
  const likeComment = await Like.create({
    comment: commentId,
    likedBy: userId
  });

  // Return the response
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    likeComment,
    "Comment liked successfully"
  ));
})

// Function to toggle like on the Tweet
const toggleTweetLike = asyncHandler(async (req, res) => {
  // Fetch the tweetId from the URL path
  const { tweetId } = req.params;
  
  // Fetch the userId from the req.user object
  const userId = req.user?._id;

  // Check if the tweetId is valid or not
  if(!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet Id");
  }

  // Find the occurence of the document if exists within the collection
  // If exists means user has already liked the tweet
  const existingLike = await Like.findOne({
    tweet: tweetId,
    likedBy: userId
  });

  // Check if the user has already liked the tweet
  if(existingLike) {
    // Remove the document from the collection - remove the like from the tweet
    await Like.findByIdAndDelete(existingLike._id);

    // Return the response
    return res
    .status(200)
    .json(new ApiResponse(
      200,
      existingLike,
      "Tweet unliked sucessfully"
    ));
  }

  // If document is not present then create it - like the tweet
  const likeTweet = await Like.create({
    tweet: tweetId,
    likedBy: userId
  });

  // Return the response
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    likeTweet,
    "Tweet liked successfully"
  ));
})

// Function to get all the liked videos
const getLikedVideos = asyncHandler(async (req, res) => {
  // Fetch the user id from req.body object
  const userId = req.user?._id;

  // Check if userId is there or not
  if(!userId) {
    throw new ApiError(400, "Invalid user id");
  }

  // Find the videos which satisfy the below conditions
  const likedVideos = await Like.find({
    likedBy: userId,
    video: { $exists: true }
  });

  // Aggregation Pipeline can also be used as an alternative
  // const likedVideos2 = await Like.aggregate([
  //   {
  //     $match: {
  //       likedBy: userId,
  //       video: { $exists: true }
  //     }
  //   },
  //   {
  //     $lookup: {
  //       from: 'videos',
  //       localField: 'video',
  //       foreignField: '_id',
  //       as: 'videoDetails'
  //     }
  //   }
  // ]);

  // Get all the Like collection
  // const likedVideos = await Like.find();

  // Return the response
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    likedVideos,
    "Fetched all the liked videos successfully"
  ))
})

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };