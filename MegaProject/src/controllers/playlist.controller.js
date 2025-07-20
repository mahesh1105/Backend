import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// Controller to create the playlist
const createPlaylist = asyncHandler(async (req, res) => {
  // Fetch the name and description from req.body
  const {name, description} = req.body;

  // Check if name and description is not empty
  if([name, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "all fields (name and description) are required");
  }

  // Fetch the current logged in user id
  const userId = req.user?._id;

  // Find the playlist from the DB - if already exists
  const existingPlaylist = await Playlist.findOne({
    $and: [
      { name }, { owner: userId }
    ]
  });

  // check if the playlist with the same name already exists or not
  if(existingPlaylist) {
    throw new ApiError(400, "Playlist with the same name already exists");
  }

  // Fetch all the videos that belongs to the current logged in user
  const userAllVideos = await Video.find({
    owner: userId
  });

  // Create the new playlist
  const userPlaylist = await Playlist.create({
    name,
    description,
    videos: userAllVideos,
    owner: userId
  });

  // Check if playlist is created or not
  if(!userPlaylist) {
    throw new ApiError(500, "Error while creating the playlist");
  }

  // Send the response
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    userPlaylist,
    "New Playlist created successfully"
  ));
})

// Controller to get all the user playlists
const getUserPlaylists = asyncHandler(async (req, res) => {
  // Fetch the user id from the URL path
  const { userId } = req.params;
  
  // Check if user id format is valid - i.e. 24 characters
  if(!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id format");
  }

  // Find all the playlists that belongs to the current user
  // const userPlaylists = await Playlist.find({
  //   owner: new mongoose.Types.ObjectId(userId)
  // });

  // Find all the playlists that belongs to the current user
  // Advanced aggregation pipeline
  const userPlaylists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first: "$owner"
              }
            }
          },
          {
            $project: {
              title: 1,
              thumbnail: 1,
              description: 1,
              owner: 1
            }
          }
        ]
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "createdBy",
        pipeline: [
          {
            $project: {
              avatar: 1,
              fullname: 1,
              username: 1
            }
          }
        ]
      }
    },
    {
      $addFields: {
        createdBy: {
          $first: "$createdBy"
        }
      }
    },
    {
      $project: {
        name: 1,
        description: 1,
        videos: 1,
        createdBy: 1
      }
    }
  ]);

  // Check if user playlist exists or not
  if(userPlaylists.length === 0) {
    throw new ApiError(404, "Invalid user id or User Playlist not found");
  }

  // Send the response
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    userPlaylists,
    "User Playlists fetched successfully"
  ));
})

// Controller to get the playlist by id
const getPlaylistById = asyncHandler(async (req, res) => {
  // Fetch the playlist based on the playlist id from URL path
  const { playlistId } = req.params;

  // Check if playlist id is valid format or not
  if(!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id format");
  }

  // Find the playlist by id
  // const playlist = await Playlist.findById(playlistId);

  // Advanced aggregation pipeline
  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first: "$owner"
              }
            }
          },
          {
            $project: {
              title: 1,
              thumbnail: 1,
              duration: 1,
              views: 1,
              owner: 1,
              createdAt: 1,
              updatedAt: 1
            }
          }
        ]
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "createdBy",
        pipeline: [
          {
            $project: {
              avatar: 1,
              fullname: 1,
              username: 1
            }
          }
        ]
      }
    },
    {
      $addFields: {
        createdBy: {
          $first: "$createdBy"
        }
      }
    },
    {
      $project: {
        name: 1,
        description: 1,
        videos: 1,
        createdBy: 1
      }
    }
  ]);

  // Check if playlist exists or not
  if(!playlist) {
    throw new ApiError(404, "Invalid Playlist id or Playlist not found");
  }

  // Return the response
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    playlist,
    "Playlist fetched successfully"
  ));
})

// Controller to add the video to playlist
const addVideoToPlaylist = asyncHandler(async (req, res) => {
  // Fetch the playlist id and video id from the URL path
  const { playlistId, videoId } = req.params;

  // Check if playlist id and video id is present or not
  if(!playlistId || !videoId) {
    throw new ApiError(400, "Both fields are mandatory - playlist id and video id");
  }

  // Find the playlist in order to add the video to the playlist
  const playlist = await Playlist.findById({
    _id: playlistId
  })

  // Check if playlist found or not
  if(!playlist) {
    throw new ApiError(404, "Invalid playlist id or playlist not found");
  }

  // Check if logged in user is the owner of the playlist - in order to add the video to playlist
  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to modify this playlist - user must be the owner of playlist in order to add the video to it");
  }

  // Check if the video already exists inside the playlist
  if(playlist.videos.filter((video) => (video?._id.toString() === videoId)).length !== 0) {
    throw new ApiError(403, "Video already exists inside the playlist");
  }

  // Add the video inside the playlist
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $push: {
        videos: new mongoose.Types.ObjectId(videoId)
      }
    },
    { new: true }
  );

  // Check if the video has added to the playlist or not
  if(!updatedPlaylist) {
    throw new ApiError(500, "Error while adding the video to the playlist");
  }

  // Return the response
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    updatedPlaylist,
    "Video has been successfully added to the playlist"
  ))
})

// Controller to remove the video from playlist
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  // Fetch the playlist id and video id from the URL path
  const { playlistId, videoId } = req.params;

  // Check if playlist id and video id is present or not
  if(!playlistId || !videoId) {
    throw new ApiError(400, "Both fields are mandatory - playlist id and video id");
  }

  // Find the playlist in order to remove the video from the playlist
  const playlist = await Playlist.findById({
    _id: playlistId
  })

  // Check if playlist found or not
  if(!playlist) {
    throw new ApiError(404, "Invalid playlist id or playlist not found");
  }

  // Check if logged in user is the owner of the playlist - in order to remove the video from playlist
  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to modify this playlist - user must be the owner of playlist in order to remove the video from it");
  }

  // Check if the video is not present inside the playlist
  if(playlist.videos.filter((video) => (video?._id.toString() === videoId)).length === 0) {
    throw new ApiError(403, "Video doesn't exist inside the playlist");
  }

  // Filter will return the array of videos satisfying the condition - i.e. exclude the video having videoId as its id
  const videos = playlist.videos.filter((video) => video?._id.toString() !== videoId);

  // Remove the video from the playlist
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        videos: videos
      }
    },
    { new: true }
  );

  // Check if the video has removed from the playlist or not
  if(!updatedPlaylist) {
    throw new ApiError(500, "Error while removing the video from the playlist");
  }

  // Return the response
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    updatedPlaylist,
    "Video has been successfully removed from the playlist"
  ));
})

// Controller to update the playlist info
const updatePlaylist = asyncHandler(async (req, res) => {
  // Fetch the playlist id from the URL path
  const { playlistId } = req.params;

  // Fetch the playlist details from req.body object
  const { name, description } = req.body;
  
  // Check if playlist id is a valid format
  if(!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id format");
  }

  // Check if both the fields are present
  if(!name || !description) {
    throw new ApiError(400, "Both the fields are mandatory");
  }

  // Find the playlist from the DB using playlist id
  const playlist = await Playlist.findById(playlistId);

  // check if the playlist is found or not
  if(!playlist) {
    throw new ApiError(404, "Invalid playlist id or playlist not found");
  }

  // Update the details to the playlist and save the model - in order to reflect the update in DB
  playlist.name = name;
  playlist.description = description;
  playlist.save();

  // Return the response
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    playlist,
    "Playlist details has been modified successfully"
  ));
})

// Controller to delete the playlist
const deletePlaylist = asyncHandler(async (req, res) => {
  // Fetch the playlist id from the URL path
  const { playlistId } = req.params;
  
  // Check if the playlist id is a valid format
  if(!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id format");
  }

  // Fetch the playlist from the DB using the playlist id
  const playlist = await Playlist.findById(playlistId);

  // Check if playlist is present or not
  if(!playlist) {
    throw new ApiError(404, "Unable to delete the playlist - playlist doesn't exists");
  }

  // Check if the loggedIn user is the owner of playlist - in order to delete the playlist
  if(playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "User must be the owner in order to delete the playlist");
  }

  // Delete the playlist
  const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

  // Check if the playlist has deleted or not
  if(!deletedPlaylist) {
    throw new ApiError(500, "Error while deleting the playlist");
  }

  // Send the response
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    deletedPlaylist,
    "Playlist has been deleted successfully"
  ));
})

export { createPlaylist, getUserPlaylists, getPlaylistById, addVideoToPlaylist, removeVideoFromPlaylist, updatePlaylist, deletePlaylist };