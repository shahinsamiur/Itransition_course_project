import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { testDBConnection } from "./config/db";
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await testDBConnection();

    app.listen(PORT, () => {
      console.log(` Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
  }
};

startServer();
