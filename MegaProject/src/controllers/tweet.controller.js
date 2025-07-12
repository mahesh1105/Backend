import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// Controller to create the tweet
const createTweet = asyncHandler(async (req, res) => {
  // Fetch the user id from the req.user
  const userId = req.user?._id;

  // Fetch the comment from req.body
  const { content } = req.body;

  // Check if content is present or not
  if(!content) {
    throw new ApiError(400, "Tweet content is missing");
  }

  // It will be undefined until you will not send raw json from frontend
  // console.log(req.body);

  // Create the new tweet
  const userTweet = await Tweet.create({
    owner: userId,
    content: content
  });

  // Check if tweet created successfully
  if(!userTweet) {
    throw new ApiError(400, "Error while creating the tweet")
  }

  // Return the response
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    userTweet,
    "New Tweet created successfully"
  ))
})

// Controller to get the user tweets
const getUserTweets = asyncHandler(async (req, res) => {
  // Fetch the user id in order to get all the tweets for the user
  const { userId } = req.params;

  // Check if user id is valid
  if(!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid User Id")
  }

  // Get all the tweets
  const userTweets = await Tweet.find({
    owner: userId  // type-conversion will happen automatically
  });

  // Check if user tweets are empty or not
  if(userTweets.length === 0) {
    throw new ApiError(400, "No Tweets found");
  }

  // Send the response
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    userTweets,
    "User tweets fetched successfully"
  ));
})

// Controller to update the tweet
const updateTweet = asyncHandler(async (req, res) => {
  // Fetch the tweet id in order to update the tweet
  const { tweetId } = req.params;

  // Check if tweet id is valid or not
  if(!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id format");
  }

  // Fetch the content for tweet that you want to update in DB
  const { content } = req.body;

  // Check if content is present or not
  if(!content) {
    throw new ApiError(400, "Tweet content is missing");
  }

  // Find the tweet in DB
  // const userTweet = await Tweet.find({
  //   _id: tweetId
  // })

  // Find the tweet in DB
  const userTweet = await Tweet.findById(tweetId);

  // Check if user tweet is valid or not
  if(!userTweet) {
    throw new ApiError(400, "Invalid Tweet Id");
  }

  // Get the logged in user id from the req.user
  const loggedInUser = req.user?._id;

  // console.log(loggedInUser); // new ObjectId('686e838fe156d8a4895498b2')
  // console.log(typeof loggedInUser); // ObjectId

  // console.log(userTweet?.owner); // new ObjectId('686e838fe156d8a4895498b2')
  // console.log(typeof userTweet?.owner);  // ObjectId

  // Output will be false even when the object id is same
  // because you are comparing their instances not the string values
  // console.log(loggedInUser === userTweet?.owner); // false

  // Check if user is the owner of tweet - comparing their string values
  if(userTweet?.owner.toString() !== loggedInUser.toString()) {
    throw new ApiError(400, "User must be the owner in order to update the tweet")
  }

  // Update the user tweet in DB
  // userTweet.content = content;

  // Save the data in DB
  // userTweet.save();

  // find the tweet by its id and update at the same time
  const modifiedTweet =  await Tweet.findByIdAndUpdate(
    {_id: tweetId},
    {
      $set: {
        content
      }
    },
    // Return the updated data - by default returns the old data
    { new: true }
  )

  // Send the response
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    modifiedTweet,
    "Tweet updated sucessfully" 
  ));
})

// Controller to delete the tweet
const deleteTweet = asyncHandler(async (req, res) => {
  // Fetch the tweet id from the URL path
  const { tweetId } = req.params;

  // Check if tweet id is valid or not
  if(!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet Id Format")
  }

  // Find the tweet in DB - result will be array either with values or empty
  // Because find will return the multiple objects which will be inside an array
  // const userTweet = await Tweet.find({
  //   _id: tweetId
  // })

  // Fetch the tweet id in DB
  const userTweet = await Tweet.findById(tweetId);

  // Check if tweet exists or not
  if(!userTweet) {
    throw new ApiError(404, "Invalid Tweet Id - Tweet not found")
  }

  // Fetch the current user id
  const loggedInUser = req.user?._id;

  if(userTweet?.owner.toString() !== loggedInUser.toString()) {
    throw new ApiError(400, "User must be the owner in order to delete the tweet")
  }

  // Delete the tweet document
  const deletedTweet = await Tweet.findByIdAndDelete({_id: tweetId});

  // if tweet deletion is not successful
  if(!deletedTweet) {
    throw new ApiError(400, "Something went wrong while deleting the tweet");
  }

  // Return the response
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    deletedTweet,
    "User Tweet deleted successfully"
  ));
})

export { createTweet, getUserTweets, updateTweet, deleteTweet };

/*
  When you call:
    Tweet.findByIdAndUpdate(tweetId, updateObject, options)

  Mongoose automatically converts this to:
    Tweet.findOneAndUpdate({ _id: tweetId }, updateObject, options)

  You can see the above line as:
    Tweet.findOneAndUpdate({}, {}, {})

  Note:
  =====
  1. Return Type
  --------------

  find() - Returns an ARRAY (even if empty or single result)

  const userTweet = await Tweet.find({ _id: tweetId });
  Result: [{ _id: "...", content: "...", ... }] or []

  findById() - Returns a SINGLE DOCUMENT or null

  const userTweet = await Tweet.findById(tweetId);
  Result: { _id: "...", content: "...", ... } or null

  2. Checking existence
  ---------------------

  With find() - check array length
    if (!userTweet || userTweet.length === 0) {
      throw new ApiError(404, "Tweet not found");
    }

  With findById() - direct null check
    if (!userTweet) {
      throw new ApiError(404, "Tweet not found");
    }

  3. Performance
  --------------

  findById() is slightly more optimized for single document retrieval
  find() has more overhead since it's designed for multiple results

  4. Usage patterns
  -----------------
  With find() - need to access first element
    const tweet = userTweet[0];
    console.log(tweet.content);

  With findById() - direct access
    console.log(userTweet.content);

  5. Intent clarity
  -----------------

  findById() clearly indicates you expect ONE specific document
  find() suggests you might be looking for multiple documents

  Recommendation:
  ---------------
  - Stick with findById() for your use case because:

  . Cleaner code (no array handling)
  . Better performance
  . More semantic (you're finding ONE tweet by ID)
  . Simpler null checking
*/