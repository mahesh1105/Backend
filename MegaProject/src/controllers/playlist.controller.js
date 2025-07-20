import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// Controller to create the playlist
const createPlaylist = asyncHandler(async (req, res) => {
  const {name, description} = req.body;

})

// Controller to get all the user playlists
const getUserPlaylists = asyncHandler(async (req, res) => {
  const {userId} = req.params;
  
})

// Controller to get the playlist by id
const getPlaylistById = asyncHandler(async (req, res) => {
  const {playlistId} = req.params;
  
})

// Controller to add the video to playlist
const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const {playlistId, videoId} = req.params;

})

// Controller to remove the video from playlist
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const {playlistId, videoId} = req.params;

})

// Controller to update the playlist info
const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  
})

// Controller to delete the playlist
const deletePlaylist = asyncHandler(async (req, res) => {
  const {playlistId} = req.params;
  
})

export { createPlaylist, getUserPlaylists, getPlaylistById, addVideoToPlaylist, removeVideoFromPlaylist, updatePlaylist, deletePlaylist };