import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// Controller to add the comment on the video
const addComment = asyncHandler(async (req, res) => {
  // Fetch the video id from the URL path
  const { videoId } = req.params;

  // Check if the video id is valid or not
  if(!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  // Fetch the user id from the req.user
  const userId = req.user?._id;

  // Fetch the content
  const { content } = req.body;

  // Check if content is missing
  if(!content) {
    throw new ApiError(400, "Content is missing");
  }

  // Create the comment document
  const userComment = await Comment.create({
    content: content,
    video: videoId,
    owner: userId
  });

  // Check if comment is added successfully
  if(!userComment) {
    throw new ApiError(400, "error while adding the comment");
  }

  // Return the response
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    userComment,
    "comment added successfully"
  ));
})

// Controller to get all the comments for the video
const getVideoComments = asyncHandler(async (req, res) => {
  // Fetch the video id from the URL path
  const { videoId } = req.params;

  // Fetch the page and limit from the URL path - query part
  // If query isn't passed to the URL then default value will be the below one
  // Ex- {{server}}/comments/6872c7f295caae2eab4013bf?page=1&limit=5
  const { page = 1, limit = 10 } = req.query;

  // After parsing the value from the URL, it will be the string
  // Below part will convert it to the Integer
  const commentsLimit = parseInt(limit);

  // Check if the video id is valid
  if(!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id format");
  }

  // Find all the comments for the provided video id
  const videoComments = await Comment.find({
    video: videoId
  })

  // Check if the video id is valid
  if(!videoComments) {
    throw new ApiError(400, "Video Id is not valid")
  }

  // Find all the comments for the video id uisng aggregate pipeline
  const allComments = await Comment.aggregate([
    // Stage 1: Match the video id
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId)
      }
    },
    // Stage 2: set the limit on the comment
    {
      $limit: commentsLimit
    }
  ]);

  // Check if the comments exists on the video
  if(!allComments) {
    throw new ApiError(404, "Comment not found")
  }

  // Return the response
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    allComments,
    "Comments fetched successfully"
  ));
})

// Controller to update the comment on the video
const updateComment = asyncHandler(async (req, res) => {
  // Fetch the user id from the req.user object
  const userId = req.user?._id;

  // Fetch the comment id from the URL path
  const { commentId } = req.params;

  // Check if the comment id is valid or not
  if(!isValidObjectId(commentId)) {
    throw new ApiError(400, "Comment Id is not a valid format");
  }

  // Fetch the content in order to update the comment
  const { content } = req.body;

  // Check if the comment is missing
  if(!content) {
    throw new ApiError("Missing content !!!");
  }

  // Find the comment document using the id
  const userComment = await Comment.findById(commentId);

  // Check if the user comment exists or not
  if(!userComment) {
    throw new ApiError(404, "Invalid Comment Id")
  }

  // Check if user is the owner of comment
  if(userComment.owner.toString() !== userId.toString()) {
    throw new ApiError("User must be the owner in order to update the video comment");
  }

  // Update the comment for the video - 1st way
  // userComment.content = content;
  // userComment.save();

  // Update the comment for the video - 2nd way
  const updatedUserComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content
      }
    },
    { new: true }
  )

  // Check if the user comment got updated or not
  if(!updatedUserComment) {
    throw new ApiError("Error while updating the user comment");
  }

  // Return the response
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    updatedUserComment,
    "Comment updated successfully"
  ));
})

// Controller to delete the existing comment on the video
const deleteComment = asyncHandler(async (req, res) => {
  // Fetch the comment id in order to delete the comment - from URL path
  const { commentId } = req.params;

  // Check if the commentId is valid
  if(!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment Id format");
  }

  // Fetch the user id from req.user object
  const userId = req.user?._id;

  // Fetch the comment document from DB
  const userComment = await Comment.findById(commentId);

  // Check if the user Comment exists or not
  if(!userComment) {
    throw new ApiError(400, "Invalid Comment Id");
  }

  // Check if user is the owner of the comment
  if(userComment?.owner.toString() !== userId.toString()) {
    throw new ApiError(400, "User must be the owner in order to delete the comment");
  }

  // Delete the comment or the document from the DB
  const deletedComment = await Comment.findByIdAndDelete(commentId);

  // Check if the comment got deleted or not
  if(!deletedComment) {
    throw new ApiError(400, "Error while updating the comment");
  }

  // Send the response
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    userComment,
    "User comment deleted successfully"
  ));
})

export { getVideoComments,  addComment,  updateComment, deleteComment };