import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import uploadOnCloudinary from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'

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

export { registerUser }

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
*/