import express from "express";
import dotenv from "dotenv";

const app = express();
dotenv.config();

app.get("/health", (req, res) => {
  res.send("Hello from the server!");
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`);
});
