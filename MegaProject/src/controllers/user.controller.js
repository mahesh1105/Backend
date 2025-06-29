import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import uploadOnCloudinary from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

// Function to generate the Access and Refresh Token
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    // Get the user by its id
    const user = await User.findById(userId);

    // The below methods belongs to user so it can be accessible from 'user' only not by mongoose 'User'
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    
    // Save the user in DB and don't validate it
    // Because while saving the user - password will kick in and if not provided will create the problem
    // So In order to solve that issue don't validate the user while saving it to DB
    await user.save({ validateBeforeSave: false });

    return {accessToken, refreshToken};
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating refresh and access token")
  }
}

// Function for user registration
const registerUser = asyncHandler(async (req, res) => {
  // Get user data from the frontend
  const { username, email, fullname, password } = req.body;

  // Validate the data
  // if(fullname === "") {
  //   throw new ApiError(400, "fullname is required");
  // }

  if([username, email, fullname, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required...");
  }

  // Check if user already exists
  // It will check whether the username or email (any one of them) exists
  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  })

  if(existedUser) {
    throw new ApiError(409, "User with email or username already exists...");
  }

  // console.log(req.files)

  // Check for images and avatar - use optional chaining to prevent the accessing from null or undefined
  const avatarLocalPath = req.files?.avatar[0]?.path;

  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if(!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required...");
  }

  // Upload them to cloudinary - It won't give error if file path is missing
  // Instead it will return the empty string
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if(!avatar) {
    throw new ApiError(400, "Avatar file upload failed...");
  }

  // Save the user details in DB
  const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullname,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "", // If coverImage is present then extract the url else keep it empty
  })

  // Check for user creation and remove specific fields from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if(!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user")
  }

  // return the response
  return res.status(201).json(new ApiResponse(200, createdUser, "User registration successful"))
})

// Function for user login - user authentication
const loginUser = asyncHandler(async (req, res) => {
  // Get user data from the frontend
  const { username, email, password } = req.body;

  // Check if username or email is present - alternate (!(username || email))
  if(!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  // Fetch user details from DB
  const user = await User.findOne({
    $or: [{username}, {email}]
  })

  // Check whether user exists or not
  if(!user) {
    throw new ApiError(404, "User does not exist")
  }

  // Verify the Password by comparing it through DB password - Password in DB is in encrypted format
  const isPasswordValid = await user.isPasswordCorrect(password);

  // Check whether password is same or not
  if(!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
  }

  // Generate Access and Refresh Token
  const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

  // Get the user reference after saving refresh token in DB - Optional
  // Here we are saying to exclude the password and refreshToken field
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  // By doing so - cookies can't be modified from frontend side - Only server can modify or delete it
  // It will be read-only in frontend side
  const options = {
    httpOnly: true,
    secure: true
  }

  // Send the Cookies and return the response
  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
      200,
      {
        user: loggedInUser,
        accessToken,
        refreshToken
      },
      "User logged In Successfully"
    )
  );
})

// Function for user logout
const logoutUser = asyncHandler(async (req, res) => {
  // Delete the refresh token from DB
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new: true
    }
  );

  // Set the options which is sent via cookies
  const options = {
    httpOnly: true,
    secure: true
  }

  // Clear the cookies and send the json response
  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User logged Out"))
})

// Function to refresh the access token
const refreshAcesssToken = asyncHandler(async (req, res) => {
  try {
    // Get the refresh token via cookies or via req.body if the request coming from mobile
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  
    // Check whether the incoming refresh token exists or not
    if(!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
    }
  
    // Verify the incoming refresh token or decode the token in order to get the user info
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  
    // Find the user in DB by its id from decoded token
    // findOne() expects an object as the filter
    const user = await User.findOne({ _id: decodedToken?._id });
  
    // Check whether the user is present in DB or not
    if(!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
  
    // Check whether the incoming refresh token is same for the user in DB or not
    if(incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used")
    }
  
    // Generate the new Access and Refresh Token
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);
  
    // Set the options which is sent via cookies
    const options = {
      httpOnly: true,
      secure: true
    }
  
    // Send the cookies and the json response to frontend
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user,
          accessToken,
          refreshToken
        },
        "Token refreshed sucessfully"
      )
    );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
})

// Function to change or update the user passowrd
const changeCurrentPassword = asyncHandler(async (req, res) => {
  // Fetch the old and new Password from req.body
  const {oldPassword, newPassword} = req.body;

  // Fetch the user info from DB by using its id from req.body
  const user = await User.findById(req.body?._id);

  // Check whether the password is correct or not by using the user method
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  
  // If password is not correct then throw the error
  if(!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  // Set the new password or update it in DB
  user.password = newPassword;

  // Save the user in DB and set validation to false so that any other field will not create the issue
  await user.save({ validateBeforeSave: false });

  // Return the response
  return res
  .status(200)
  .json(new ApiResponse(200, {}, "Password changed successfully"));
})

// Function to get the current user
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    req.user,
    "current user fetched successfully"
  ))
})

// Function to update user's account info
const updateAccountDetails = asyncHandler(async (req, res) => {
  // Fetch user detals (which you want to update) from req.body
  const {fullname, email} = req.body;

  // Check if fullname and email both are present or not
  if(!fullname || !email) {
    throw new ApiError(400, "All fields are required");
  }

  // Find the user and update the info at the same time
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email
      }
    },
    // this is mandatory if you want to return the new information (after saving)
    {new: true}
  ).select("-password")

  // Return the response
  return res
  .status(200)
  .json(new ApiResponse(200, user, "Account details updated successfully"))
})

// Function to update the user's avatar
const updateUserAvatar = asyncHandler(async (req, res) => {
  // Fetch avatar image local path - whether the image is present in temporary folder or not
  const avatarLocalPath = req.file?.path;

  // Check whether the path is there or not
  if(!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  // Upload the file on cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  // If image uploaded successfully then its result must have a url key if not then throw error
  if(!avatar.url) {
    throw new ApiError(400, "Error while uploading on cloudinary");
  }

  // Update the avatar url in DB
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url
      }
    },
    // this is mandatory if you want to return the new information (after saving)
    {new: true}
  ).select("-password");

  // Return the response
  return res
  .status(200)
  .json(new ApiResponse(200, user, "avatar updated successfully"));
})

// Function to update the user's cover image
const updateUserCoverImage = asyncHandler(async (req, res) => {
  // Fetch cover image local path - whether the image is present in temporary folder or not
  const coverImageLocalPath = req.file?.path;

  // Check whether the path is there or not
  if(!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image file is missing");
  }

  // Upload the file on cloudinary
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // If image uploaded successfully then its result must have a url key if not then throw error
  if(!coverImage.url) {
    throw new ApiError(400, "Error while uploading on cloudinary");
  }

  // Update the cover image url in DB
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url
      }
    },
    // this is mandatory if you want to return the new information (after saving)
    {new: true}
  ).select("-password");

  // Return the response
  return res
  .status(200)
  .json(new ApiResponse(200, user, "Cover Image updated successfully"));
})

// Function to get the User profile
const getUserChannelProfile = asyncHandler(async (req, res) => {
  // Fetch the username from the url
  const {username} = req.params;

  // Check if username exists or not, if exists then trim for unnecessary spaces
  if(!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }

  // Aggregation Pipeline
  const channel = await User.aggregate([
    {
      // Check for username in user model
      $match: {
        username: username?.toLowerCase()
      }
    },
    // Check for the subscribers using channel field
    // How many are subscribed to the channel
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    // Check for how many channel has subscribed by user
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    // Add the fields in user model
    {
      $addFields: {
        // Count the subscribers of the channel - $ is used for fields
        subscribersCount: {
          $size: "$subscribers"
        },
        // Count the channel that user has subscribed to
        channelsSubscribedToCount: {
          $size: "$subscribedTo"
        },
        // Check whether the user has subscribed to the channel or not
        isSubscribed: {
          $cond: {
            if: {$in: [req.user?._id, "$subscribers.subscriber"]},
            then: true,
            else: false
          }
        }
      }
    },
    // Passes along the documents with the requested fields to the next stage in the pipeline
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1
      }
    }
  ])

  // Check whether the channel is present or not
  if(!channel?.length) {
    throw new ApiError(404, "channel does not exists")
  }

  // Return the response
  return res
  .status(200)
  .json(new ApiResponse(200, channel[0], "User channel fetched successfully"))
})

// Function to get the User watch history
const getWatchHistory = asyncHandler(async (req, res) => {
  // Fetch watch history of the user using aggregation pipeline
  // This will always return an array so always send its first value
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        // Sub-pipeline
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              // Sub-pipeline
              pipeline: [
                {
                  // Only take these values from user model for owner field
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          // Overwrite the owner field by taking first value from the array
          // As pipeline will return the array which have size of 1
          {
            $addFields: {
              owner: {
                $first: "$owner"
              }
            }
          } 
        ]
      }
    }
  ])

  // Return the response
  return res
  .status(200)
  .json(
    new ApiResponse(
      200, 
      user[0].watchHistory, 
      "Watch History fetched successfully"
    )
  )
})

export { registerUser, loginUser, logoutUser, refreshAcesssToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory }

/*
  Steps for user registration:
  ----------------------------
  1. Get User details from frontend
  2. Validation of data - not empty
  3. Check if user already registered or exists: username, email
  4. check for images and avatar
  5. upload them to cloudinary
  6. create user object - create entry in db
  7. remove password and refresh token field from response
  8. check for user creation
  9. return response if successful else error

  Steps for user login:
  ---------------------
  1. Get User details from frontend - req.body
  2. username or email
  3. Find the user
  4. Check for password
  5. Access and Refresh Token generation
  6. Send Cookies
  7. Return response if successful, else error

  Note:
  -----
  Whenever we use 'User' - this is the one which is exported by us after creating the schema
  This will use mongoose methods, like - findOne, findById, etc.

  If you want to use the methods created by you for user models then you have to use 'user'
  which is the reference of the user after user has found in DB by using the findOne or findById methods

  Note:
  -----
  - We will provide access token to the user in order to validate the login request
  - We will store the refresh token in database so that we don't have to ask the password from user everytime

  Steps for user logout:
  ----------------------
  1. Clear the cookies
  2. Clear the refresh token from DB

  Middleware - Jane se pehle milke jana
  DataBase is in another continent - takes times while doing operation with it

  Access Token - Short lived, not stored in db
  Refresh Token - Long lived, stored in db
  When access token expires, the frontend sends the refresh token to the backend to validate user (login), once again.

  ==> Super Note:
  ---------------
  While creating the JWT, it will take the payload (data to be included in the token), a secret key and expiry time and
  based on all these things, it will generate the json web token

  This is how token can be generated - 
  ==> Generate the JWT
  jwt.sign(
    // Define the payload (data to be included in the token)
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullname: this.fullname,
    },
    // Define the Secret Key
    process.env.ACCESS_TOKEN_SECRET,
    // EXPIRY TIME
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  )
  
  tokens will look something like this - 
  Access Token:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2ODYwNWViNGEzZWZjNzE2MTU1MzY5OGUiLCJlbWFpbCI6Im5zZGpmdWt3amRmQGdtYWlsLmNvbSIsInVzZXJuYW1lIjoiamRoZXVpZCIsImZ1bGxuYW1lIjoiQWxleCIsImlhdCI6MTc1MTE3NTIzMiwiZXhwIjoxNzUxMjYxNjMyfQ.Ad_vVOVOb1fIUipTiEtjYLRR0F5aWUj1xAWbRoFbEsc
  Refresh Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2ODYwNWViNGEzZWZjNzE2MTU1MzY5OGUiLCJlbWFpbCI6Im5zZGpmdWt3amRmQGdtYWlsLmNvbSIsInVzZXJuYW1lIjoiamRoZXVpZCIsImZ1bGxuYW1lIjoiQWxleCIsImlhdCI6MTc1MTE3NTIzMiwiZXhwIjoxNzUyMDM5MjMyfQ.ewOW4mq3tdk8XZq_mvrdNzBuU69Fw8jbfqkKdnsxJ68

  the above tokens (access and refresh) will be sent to the frontend via secure cookies and refresh token will also be stored in DB
  because if access token expires then with the help of refresh token present in cookies, we will verify whether the refresh token is same in DB or not
  that helps in user authentication without entering password again, that's why we decode the token using jwt.verify() method to get teh user id

  decoded token will look something like this - 
  {
    _id: '68605eb4a3efc7161553698e',
    email: 'nsdjfukwjdf@gmail.com',
    username: 'jdheuid',
    fullname: 'Alex',
    iat: 1751175232,
    exp: 1752039232
  }
*/