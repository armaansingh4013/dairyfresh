import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { ensureCoreDemoData } from "./services/demo.service.js";

dotenv.config();

const port = process.env.PORT || 4000;

async function bootstrap() {
  try {
    await connectDB();
    await ensureCoreDemoData();

    if (process.env.NO_LISTEN !== "1") {
      app.listen(port, () => {
        console.log(`API listening on ${port}`);
      });
    }
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

bootstrap();