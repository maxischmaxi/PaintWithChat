import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Try multiple paths to find the root .env file
const possibleEnvPaths = [
  // From packages/api (when running with pnpm dev from root)
  path.resolve(process.cwd(), "../../.env"),
  // From monorepo root
  path.resolve(process.cwd(), ".env"),
  // From compiled dist directory
  path.resolve(__dirname, "../../../.env"),
  // Absolute path based on process.cwd()
  path.resolve(process.cwd().split("/packages/")[0], ".env"),
];

let envLoaded = false;
for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    console.log(`📄 Loading .env from: ${envPath}`);
    dotenv.config({ path: envPath });
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn(`⚠️  No .env file found. Tried paths:`, possibleEnvPaths);
}

// Also try to load from current directory as fallback
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/streamdraw",
  jwtSecret: process.env.JWT_SECRET || "change-this-secret",
  corsOrigin: process.env.CORS_ORIGIN?.split(",") || [
    "http://localhost:5173",
    "http://localhost:5174",
  ],
  twitch: {
    clientId: process.env.TWITCH_CLIENT_ID || "",
    clientSecret: process.env.TWITCH_CLIENT_SECRET || "",
    redirectUri:
      process.env.TWITCH_REDIRECT_URI || "http://localhost:5173/auth/callback",
  },
  nodeEnv: process.env.NODE_ENV || "development",
};

// Validate required config
if (!config.twitch.clientId || !config.twitch.clientSecret) {
  console.warn("⚠️  Warning: Twitch OAuth credentials not configured");
  console.warn(
    `   TWITCH_CLIENT_ID is ${config.twitch.clientId ? "SET" : "MISSING"}`,
  );
  console.warn(
    `   TWITCH_CLIENT_SECRET is ${config.twitch.clientSecret ? "SET" : "MISSING"}`,
  );
} else {
  console.log("✅ Twitch OAuth credentials loaded successfully");
}
