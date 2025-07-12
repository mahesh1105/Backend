import mongoose, { isValidObjectId } from "mongoose"
import {  Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// Controller to toggle the subscription
const toggleSubscription = asyncHandler(async (req, res) => {
  // Fetch the channel id from the URL path
  const { channelId } = req.params;

  // Fetch the user id req.user object
  const userId = req.user._id;
  
  // Check If channel id is a valid object
  if(!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel ID");
  }

  // Check if the user is already subscribed
  const existingSubscriber = await Subscription.findOne({
    subscriber: userId,
    channel: channelId
  })

  // If user is already subscribed then unsubscribe the channel
  if(existingSubscriber) {
    await Subscription.findByIdAndDelete(existingSubscriber._id);

    // Return the response
    return res
    .status(200)
    .json(new ApiResponse(
      200,
      existingSubscriber,
      "Channel unsubscribed sucessfully"
    ))
  }

  // Subscribe the channel
  const subscribeChannel = await Subscription.create({
    subscriber: userId,
    channel: channelId
  });

  // If Subscription is not successful
  if(!subscribeChannel) {
    throw new ApiError(500, "Error while subscribing the channel")
  }

  // Return the response
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    subscribeChannel,
    "Channel subscribed sucessfully"
  ));
})

// Controller to return subscriber list of a channel - users who are subscribed to your channel (you are the user)
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  // Fetch the channel id from the URL path
  const { channelId } = req.params;

  // console.log(channelId);
  // console.log(typeof channelId);  // string

  // Check if the channel id is valid
  if(!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel Id")
  }

  // Fetch all the list of subscriber who are subscribed to the your channel
  // const subscriberList = await Subscription.find({
  //   channel: channelId
  // })

  // Using Aggregation pipeline for advanced querying
  // Here it will take as raw query - you need to do the type conversion manually, if needed
  const subscriberList = await Subscription.aggregate([
    // Stage1 - Match to filter subscriptions by channel id
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId)
      }
    },
    // Stage 2 - Lookup to join with User collection
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriberDetails"
      }
    },
    // Stage 3 - Flatten the array
    {
      $unwind: "$subscriberDetails"
    },
    // Stage 4 - Project to modify to the output document
    {
      $project: {
        _id: 1,
        subscriber: 1,
        channel: 1,
        subscriberDetails: {
          username: "$subscriberDetails.username",
          email: "$subscriberDetails.email",
          fullname: "$subscriberDetails.fullname",
          subscribedSince: "$subscriberDetails.createdAt",
        }
      }
    }
  ]);

  // Return the response
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    subscriberList,
    "Subscriber list fetched successfully"
  ))
})

// Controller to return channel list to which you have subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  // Fetch the subscriber id from the URL path
  const { subscriberId } = req.params;

  // Check if the subscriber id is valid
  if(!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Imvalid subscriber id");
  }

  // Fetch all the channel to which user(you) have subscribed
  const subscribedChannelList = await Subscription.find({
    subscriber: subscriberId
  });

  // Return the response
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    subscribedChannelList,
    "Channel list fetched successfully"
  ));
})

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };

// To Imagine the above scenario:
// Suppose you are a user and channel owner on youtube
// you have subscribed to many channels and many people have subscribed to your channel
// So, you are the user - think from that perspective

/*
  {
    $lookup: {
      from: "users",
      localField: "subscriber",
      foreignField: "_id",
      as: "subscriberDetails"
    }
  }

  --> Lookup output - an array of size 1
  
  "subscriberDetails": [
    {
      "_id": "686e838fe156d8a4895498b2",
      "username": "user2",
      "email": "user2@gmail.com",
      "fullname": "Two User",
      "avatar": "http://res.cloudinary.com/dvsdazxmf/image/upload/v1752073102/w3pjlqtsfdaoc76cddhr.png",
      "coverImage": "http://res.cloudinary.com/dvsdazxmf/image/upload/v1752073103/mfibrdyrinzs04ggyd85.jpg",
      "watchHistory": [],
      "password": "$2b$10$jqC247adH90LRs6XI0SIDe1MYcxb1Fp.utHD3EGoUJk7Zmk4f.aUG",
      "createdAt": "2025-07-09T14:58:23.906Z",
      "updatedAt": "2025-07-09T14:58:23.906Z",
      "__v": 0
    }
  ]

  after getting the array output - we have many choices for further stages
  1. use $unwind to flatten the array
  2. use $arrayElemAt with index 0 - as size is 1 only
  3. use $first with field.subField

  Method 1:
  {
    $unwind: "$subscriberDetails"
  }
  
  Method 2:
  {
    $project: {
      _id: 1,
      subscriber: 1,
      channel: 1,
      subscriberDetails: {
        username: { $arrayElemAt: ["$subscriberDetails.username", 0] },
        email: { $arrayElemAt: ["$subscriberDetails.email", 0] },
        fullname: { $arrayElemAt: ["$subscriberDetails.fullname", 0] },
        subscribedSince: { $arrayElemAt: ["$subscriberDetails.createdAt", 0] }
      }
    }
  }
  
  Method 3:
  {
    $project: {
      _id: 1,
      subscriber: 1,
      channel: 1,
      subscriberDetails: {
        username: { $first: "$subscriberDetails.username" },
        email: { $first: "$subscriberDetails.email" },
        fullname: { $first: "$subscriberDetails.fullname" },
        subscribedSince: { $first: "$subscriberDetails.createdAt" }
      }
    }
  }
*/