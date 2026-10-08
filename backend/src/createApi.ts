import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errorHandler";
import authRouter from "./routes/auth.route";
import communityRouter from "./routes/community.route";
import roomRouter from "./routes/room.route";
import eventRouter from "./routes/event.route";
import messageRouter from "./routes/message.route";
import uploadRouter from "./routes/upload.route";
import summaryRouter from "./routes/summary.route";
import userRouter from "./routes/user.route";
import reportRouter from "./routes/report.route";
import conversationRouter from "./routes/conversation.route";

const createApi = () => {
  const app = express();

  app.disable("etag");

  app.use(
    cors({
      origin: process.env.FRONTEND_URL!,
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json());

  app.use("/auth", authRouter);
  app.use("/communities", communityRouter);
  app.use("/rooms", roomRouter);
  app.use("/events", eventRouter);
  app.use("/messages", messageRouter);
  app.use("/uploads", uploadRouter);
  app.use("/summary", summaryRouter);
  app.use("/users", userRouter);
  app.use("/reports", reportRouter);
  app.use("/conversations", conversationRouter);

  app.use(errorHandler);

  return app;
};

export default createApi;
