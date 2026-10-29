import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// limiting the size of req json data
// this is the limit of data that we get from for eg form
app.use(express.json({ limit: "16kb" }));

// to config url that the req is coming from
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// to use static assests like fevicon, img temp
app.use(express.static("public"));

// to perform crud on cookie and configure it
app.use(cookieParser());

// routes
import userRouter from "./routes/user.route.js";

// routes declaration
app.use("/api/v1/users", userRouter);

export default app;
