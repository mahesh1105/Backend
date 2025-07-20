import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// Controller to get the channel stats like - total views, subscribers, videos, likes, etc.
const getChannelStats = asyncHandler(async (req, res) => {
  // Fetch the user id in order to get all the stats
  const userId = req.user?._id;

  
})

// Controller to get all the videos uploaded by the channel
const getChannelVideos = asyncHandler(async (req, res) => {
  
})

export { getChannelStats, getChannelVideos };