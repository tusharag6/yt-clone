import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video Id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "video not found");
  }

  try {
    const likedVideo = await Like.findOne({
      video: videoId,
      likedBy: userId,
    });

    if (likedVideo) {
      await Like.findOneAndDelete({
        video: videoId,
        likedBy: userId,
      });
      return res.status(200).json(new ApiResponse(200, {}, "video unliked"));
    } else {
      await Like.create({
        likedBy: userId,
        video: videoId,
      });
      return res.status(200).json(new ApiResponse(200, {}, "video liked"));
    }
  } catch (error) {
    throw new ApiError(500, "Something went wrong while liking the video");
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid video Id");
  }

  const comment = await Video.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "video not found");
  }

  try {
    const likedComment = await Like.findOne({
      comment: commentId,
      likedBy: userId,
    });

    if (likedComment) {
      await Like.findOneAndDelete({
        comment: commentId,
        likedBy: userId,
      });
      return res.status(200).json(new ApiResponse(200, {}, "comment unliked"));
    } else {
      await Like.create({
        likedBy: userId,
        comment: commentId,
      });
      return res.status(200).json(new ApiResponse(200, {}, "comment liked"));
    }
  } catch (error) {
    throw new ApiError(500, "Something went wrong while liking the comment");
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet Id");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "tweet not found");
  }

  try {
    const likedTweet = await Like.findOne({
      tweet: tweetId,
      likedBy: userId,
    });

    if (likedTweet) {
      await Like.findOneAndDelete({
        tweet: tweetId,
        likedBy: userId,
      });
      return res.status(200).json(new ApiResponse(200, {}, "tweet unliked"));
    } else {
      await Like.create({
        likedBy: userId,
        tweet: tweetId,
      });
      return res.status(200).json(new ApiResponse(200, {}, "tweet liked"));
    }
  } catch (error) {
    throw new ApiError(500, "Something went wrong while liking the tweet");
  }
});

// TODO: check if this is correct or not
const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "likedBy",
        as: "likedVideos",
        pipeline: [
          {
            $lookup: {
              from: "videos",
              localField: "video",
              foreignField: "_id",
              as: "video",
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
              ],
            },
          },
          {
            $addFields: {
              video: {
                $first: "$video",
              },
            },
          },
        ],
      },
    },
  ]);

  const likedVideos = user[0]?.likedVideos || [];

  return res
    .status(200)
    .json(new ApiResponse(200, likedVideos, "Liked videos fetched"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
