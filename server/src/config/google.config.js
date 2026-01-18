import dotenv from "dotenv";

dotenv.config({ quiet: true });

export const config = {
  googleApiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
  vvsModel: process.env.VVS_MODEL || "gemini-2.5-flash",
};
