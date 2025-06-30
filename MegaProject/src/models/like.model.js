import mongoose, { Schema } from 'mongoose'

const likeSchema = new Schema(
  {
    // Liked the comment
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
    // Liked the video
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
    },
    // Liked the tweet
    tweet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tweet",
    },
    // User who liked the video, comment and tweet
    likedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
)

export const Like = mongoose.model("Like", likeSchema);