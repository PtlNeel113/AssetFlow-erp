import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import apiRoutes from "./server/apiRoutes";

const app = express();
const PORT = 3000;

app.use(express.json());

// Register modular backend routes
app.use("/api", apiRoutes);

// Vite server connection for development, otherwise serve built assets
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`AssetFlow full-stack server listening on port ${PORT}`);
});
