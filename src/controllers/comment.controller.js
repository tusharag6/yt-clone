import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
  // aggregation pipeline to show all the comments and user details of each comment
  const comments = await Comment.aggregate([
    {
      $match: {
        video: mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullName: 1,
              userName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
  ]);

  res.status(200).json(new ApiResponse(200, comments, "Comments fetched"));
});

const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { videoId } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  if (typeof content !== "string" || !content.trim()) {
    throw new ApiError(400, "Comment content is required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "No video found");
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: userId,
  });

  if (!comment) {
    throw new ApiError(
      400,
      "Something went wrong while adding comment to the video"
    );
  }

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added to the video"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { videoId, commentId } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(videoId) || !isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid video or comment id");
  }

  if (typeof content !== "string" || !content.trim()) {
    throw new ApiError(400, "Comment content is required");
  }

  const updatedComment = await Comment.findOneAndUpdate(
    {
      video: videoId,
      owner: userId,
      _id: commentId,
    },
    {
      $set: {
        content,
      },
    },
    { new: true }
  );

  if (!updatedComment) {
    throw new ApiError(404, "Error while updating the comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { videoId, commentId } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(videoId) || !isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid video or comment id");
  }

  const deletedComment = await Comment.findOneAndDelete({
    video: videoId,
    owner: userId,
    _id: commentId,
  });

  if (!deletedComment) {
    throw new ApiError(400, "Error while deleting the comment");
  }

  return res.status(200).json(new ApiResponse(200, {}, "Comment deleted"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
