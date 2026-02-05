import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp", "tesseract.js"],
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
