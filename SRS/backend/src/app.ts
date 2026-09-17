import express from "express";

import seatRoutes from "./routes/seatRoutes";
import holdRoutes from "./routes/holdRoutes";
import waitlistRoutes from "./routes/waitlistRoutes";
import eventLogRoutes from "./routes/eventLogRoutes";

const app = express();

app.use(express.json());

// Register routes
app.use("/seats", seatRoutes);
app.use("/holds", holdRoutes);
app.use("/waitlist", waitlistRoutes);
app.use("/events", eventLogRoutes);

export default app;