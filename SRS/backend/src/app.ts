
import express from "express";
import cors from "cors";
import seatRoutes from "./routes/seatRoutes";
import holdRoutes from "./routes/holdRoutes";
import waitlistRoutes from "./routes/waitlistRoutes";
import eventLogRoutes from "./routes/eventLogRoutes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/seats", seatRoutes);
app.use("/holds", holdRoutes);
app.use("/waitlist", waitlistRoutes);
app.use("/events", eventLogRoutes);

// must be registered after the routes — Express only treats a
// 4-argument middleware as an error handler if it comes last
app.use(errorHandler);

export default app;