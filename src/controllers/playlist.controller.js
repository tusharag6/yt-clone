import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (typeof name !== "string" || !name.trim()) {
    throw new ApiError(400, "playlist name is required");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user.id,
  });

  if (!playlist) {
    throw new ApiError(500, "Error while creating the playlist");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "playlist created"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  const user = await User.aggregate([
    {
      $match: {
        _id: mongoose.Schema.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "playlists",
        localField: "_id",
        foreignField: "owner",
        as: "playlists",
      },
    },
  ]);

  const playlists = user[0]?.playlists || [];

  return res
    .status(200)
    .json(new ApiResponse(200, playlists, "All user playlist fetched"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "No playlist found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist or video id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const updatedPlaylist = await Playlist.findOneAndUpdate(
    {
      _id: playlistId,
      owner: req.user._id,
    },
    {
      $addToSet: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedPlaylist) {
    throw new ApiError(
      400,
      "Something went wrong while adding video to playlist"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video added to the playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist or video id");
  }

  const updatedPlaylist = await Playlist.findOneAndUpdate(
    {
      _id: playlistId,
      owner: req.user._id,
    },
    {
      $pull: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedPlaylist) {
    throw new ApiError(
      400,
      "Something went wrong while removing video from playlist"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "Video removed from the playlist")
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  const deletedPlaylist = await Playlist.findOneAndDelete({
    _id: playlistId,
    owner: req.user?._id,
  });

  if (!deletedPlaylist) {
    throw new ApiError(404, "playlist not found or you are not authorized");
  }

  return res.status(200).json(new ApiResponse(200, {}, "Playlist deleted"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (typeof name !== "string" || !name.trim()) {
    throw new ApiError(400, "playlist name is required");
  }

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  const updatedPlaylist = await Playlist.findOneAndUpdate(
    {
      _id: playlistId,
      owner: req.user?._id,
    },
    {
      $set: {
        name,
        description,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedPlaylist) {
    throw new ApiError(400, "Something went wrong while updating the playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Playlist updated"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
