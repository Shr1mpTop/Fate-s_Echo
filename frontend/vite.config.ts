import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "serve-cards",
      configureServer(server) {
        server.middlewares.use("/cards", (req, res, next) => {
          const url = decodeURIComponent(req.url || "");
          const filePath = path.join(
            __dirname,
            "..",
            "resources",
            "Tarot Playing Cards",
            "PNG",
            url.startsWith("/") ? url.slice(1) : url,
          );
          if (fs.existsSync(filePath)) {
            res.setHeader("Content-Type", "image/png");
            fs.createReadStream(filePath).pipe(res);
          } else {
            next();
          }
        });
      },
    },
  ],
});
