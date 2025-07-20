import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// Controller to get the channel stats like - total views, videos, subscribers, likes, etc.
const getChannelStats = asyncHandler(async (req, res) => {
  // Fetch the user id in order to get all the stats
  const userId = req.user?._id;

  // Get the total views and videos on channel
  const videos = await Video.aggregate([
    {
      $match: {
        owner: userId
      }
    },
    {
      $group: {
        // Group all the documents based on the given field
        // Owner will be the same for all the documents
        _id: "$owner",
        totalViews: {
          $sum: "$views"
        },
        totalVideos: {
          $sum: 1
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalViews: 1,  
        totalVideos: 1
      }
    }
  ]);

  // Get the channel subscribers
  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: userId
      }
    },
    {
      $group: {
        _id: "$channel",
        totalSubscribers: {
          $sum: 1
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalSubscribers: 1
      }
    }
  ]);

  // Get Total likes on the channel - including videos, comments, and tweet
  const likes = await Like.aggregate([
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoInfo"
      }
    },
    {
      $lookup: {
        from: "comments",
        localField: "comment",
        foreignField: "_id",
        as: "commentInfo"
      }
    },
    {
      $lookup: {
        from: "tweets",
        localField: "tweet",
        foreignField: "_id",
        as: "tweetInfo"
      }
    },
    {
      $match: {
        $or: [
          {
            "videoInfo.owner": userId
          },
          {
            "commentInfo.owner": userId
          },
          {
            "tweetInfo.owner": userId
          },
        ]
      }
    },
    {
      $group: {
        _id: null,
        totalLikes: {
          $sum: 1
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalLikes: 1
      }
    }
  ]);

  // Combine all the likes info inside the single object
  const likesInfo = {
    totalViews: videos[0].totalViews,
    totalVideos: videos[0].totalVideos,
    totalSubscribers: subscribers[0].totalSubscribers,
    totalLikes: likes[0].totalLikes
  }

  // Return the response
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    likesInfo,
    "Channel Stats fetched successfully"
  ));
})

// Controller to get all the videos uploaded by the channel
const getChannelVideos = asyncHandler(async (req, res) => {
  // Fetch the user id from the URL path
  const userId = req.user?._id;

  // Find all the channel videos - user channel videos
  const videos = await Video.aggregate([
    {
      $match: {
        owner: userId
      }
    },
    {
      $project: {
        title: 1,
        description: 1,
        videoFile: 1,
        thumbnail: 1,
        duration: 1,
        views: 1,
        createdAt: 1,
        updatedAt: 1
      }
    }
  ]);

  // Check if the videos are present or not
  if(!videos) {
    throw new ApiError(400, "Videos not found");
  }

  // Send the response
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    videos,
    "Channel videos has been fetched successfully"
  ));
})

export { getChannelStats, getChannelVideos };