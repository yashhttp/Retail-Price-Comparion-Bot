const express = require("express");
const http = require("http");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const { connectDb } = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const { initializeSocket } = require("./socket");
const authRoutes = require("./routes/authRoutes");
const priceRoutes = require("./routes/priceRoutes.js");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/prices", priceRoutes);

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 4000;

connectDb()
  .then(() => {
    initializeSocket(server);
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to database", error);
    process.exit(1);
  });
