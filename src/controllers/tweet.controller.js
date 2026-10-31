import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  try {
    const { content } = req.body;

    if (typeof content !== "string" || !content.trim()) {
      throw new ApiError(400, "Content must be present");
    }

    const tweet = await Tweet.create({
      content: content.trim(),
      owner: req.user?._id,
    });

    return res.status(201).json(new ApiResponse(201, tweet, "tweet created"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while creating the tweet"
    );
  }
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(id)) {
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
        from: "tweets",
        localField: "_id",
        foreignField: "owner",
        as: "tweets",
      },
    },
  ]);

  const tweets = user[0]?.tweets ?? [];
  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "All user tweets fetched"));
});

const updateTweet = asyncHandler(async (req, res) => {
  try {
    const { content } = req.body;
    const { id } = req.params;
    const userId = req.user?._id;

    if (!isValidObjectId(id)) {
      throw new ApiError(400, "Invalid tweet id");
    }

    if (typeof content !== "string" || !content.trim()) {
      throw new ApiError(400, "Content must be present");
    }

    const updatedTweet = await Tweet.findOneAndUpdate(
      {
        _id: id,
        owner: req.user_id,
      },
      {
        $set: {
          content: content.trim(),
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedTweet) {
      throw new ApiError(404, "Tweet not found or you are not authorized");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updatedTweet, "Tweet updated"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while updating the tweet"
    );
  }
});

const deleteTweet = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!isValidObjectId(id)) {
      throw new ApiError(400, "Invalid tweet id");
    }

    const deletedTweet = await Tweet.findOneAndDelete({
      _id: id,
      owner: req.user._id,
    });

    if (!deletedTweet) {
      throw new ApiError(404, "tweet not found or you are not authorized");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, deletedTweet, "tweet deleted"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while deleting the tweet"
    );
  }
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
