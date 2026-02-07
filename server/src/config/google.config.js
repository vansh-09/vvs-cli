import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  quiet: true,
  path: path.join(__dirname, "..", "..", ".env"),
});

export const config = {
  googleApiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
  vvsModel: process.env.VVS_MODEL || "gemini-2.5-flash",
};
