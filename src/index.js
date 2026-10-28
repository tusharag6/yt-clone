import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({
  path: "./env",
});

// whenever async method is completed, technically  it returns a promise, we can use .then and .catch here
connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(` Server is running at port : ${process.env.PORT} `);
    });
  })
  .catch((error) => {
    console.log("MONGODB Connection Failed !!!", error);
  });
