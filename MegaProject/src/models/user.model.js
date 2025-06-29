import mongoose, { Schema } from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    avatar: {
      type: String, // Cloudinary URL
      required: true,
    },
    coverImage: {
      type: String, // Cloudinary URL
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video"
      }
    ],
    password: {
      type: String,
      required: [true, 'Password is required']
    },
    refreshToken: {
      type: String
    }
  },
  { timestamps: true }
);

// pre is a middleware which will run before any operation
// Here we are saying, run just before saving the data in DB
// and then pass the flag to next middleware using next()
// Problem - suppose if condition is not there,, then everytime when something changes in DB eg - avatar, username, then
// before saving that, this method will run and hash the password everytime, resulting in different hash each time
// That's why we have added the condition - only execute if the password field is modified else just pass to next()
// pre is pre-defined method in mongoose library
userSchema.pre("save", async function(next) {
  if(!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
})

// Create a custom method to check whether the encrypted password is correct or not
// async await used - because these process will take some time to execute
userSchema.methods.isPasswordCorrect = async function(password) {
  return await bcrypt.compare(password, this.password);
}

// Custom method to generate the access token
userSchema.methods.generateAccessToken = function() {
  // Generate the JWT
  return jwt.sign(
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
}

// Custom method to generate the refresh token
userSchema.methods.generateRefreshToken = function() {
  // Generate the JWT
  return jwt.sign(
    // Define the payload (data to be included in the token)
    {
      _id: this._id
    },
    // Define the Secret Key
    process.env.REFRESH_TOKEN_SECRET,
    // EXPIRY TIME
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}

export const User = mongoose.model("User", userSchema);

// Note: if you use arrow function then you will not get the access of this (current reference)
// If you want, then you have to use the function expression

/*
  🧠 Think Like a Developer:
  ==========================
  Example:
  --------
  You log into an app:

  ✅ The server gives you:

  access_token: valid for 10 minutes
  refresh_token: valid for 7 days

  After 10 minutes:
  Your access_token expires.

  But instead of forcing a full login again, your frontend app silently sends the refresh token to the backend.

  If valid, the backend issues a new access token.
*/