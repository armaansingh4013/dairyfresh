import fs from "fs";
import path from "path";

const root = process.cwd();
const files = [
  {
    example: path.join(root, "apps/api/.env.example"),
    target: path.join(root, "apps/api/.env"),
    name: "API"
  },
  {
    example: path.join(root, "apps/web/.env.example"),
    target: path.join(root, "apps/web/.env"),
    name: "Web"
  },
  {
    example: path.join(root, "apps/admin/.env.example"),
    target: path.join(root, "apps/admin/.env"),
    name: "Admin"
  },
  {
    example: path.join(root, "apps/mobile/.env.example"),
    target: path.join(root, "apps/mobile/.env"),
    name: "Mobile"
  }
];

let missing = 0;

for (const f of files) {
  if (!fs.existsSync(f.target)) {
    fs.copyFileSync(f.example, f.target);
    console.log(`[bootstrap] Created ${f.name} .env from example`);
  }
}

const apiEnvPath = path.join(root, "apps/api/.env");
if (fs.existsSync(apiEnvPath)) {
  const apiEnv = fs.readFileSync(apiEnvPath, "utf8");
  const line = apiEnv
    .split("\n")
    .find((l) => l.trim().startsWith("MONGODB_URL="));
  if (!line || line.includes("127.0.0.1:27017/dairy")) {
    console.warn(
      "[bootstrap] Update MONGODB_URL in apps/api/.env before starting the API."
    );
    missing++;
  }
}

if (missing > 0) {
  console.warn("[bootstrap] Fix env values and re-run bootstrap if needed.");
}
