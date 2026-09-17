
import app from "./app";
import { expiryScheduler } from "./container";

const PORT = process.env.PORT ?? 5000;

expiryScheduler.start();

app.listen(PORT, () => {
    console.log(`server is running on http://localhost:${PORT}`);
});