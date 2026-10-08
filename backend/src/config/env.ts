import "dotenv/config";

const required = [
  "DATABASE_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "FRONTEND_URL",
];

const missing = required.filter((name) => !process.env[name]);

if (missing.length > 0) {
  throw new Error(
    `Missing environment variables: ${missing.join(", ")}. ` +
      `Copy backend/.env.example to backend/.env and fill them in.`,
  );
}
