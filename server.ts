import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const PRODUCTS_FILE = path.join(process.cwd(), "products.json");

  app.use(express.json());

  // API Routes
  app.get("/api/products", async (req, res) => {
    try {
      const data = await fs.readFile(PRODUCTS_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      res.status(500).json({ error: "Failed to read products" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const { name, price, image, category } = req.body;
      if (!name || !price) {
        return res.status(400).json({ error: "Name and price are required" });
      }

      const data = await fs.readFile(PRODUCTS_FILE, "utf-8");
      const products = JSON.parse(data);
      
      const newProduct = {
        id: Date.now(),
        name,
        price: parseFloat(price),
        category: category || "Electronics",
        image: image || "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80"
      };

      products.push(newProduct);
      await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2));
      res.status(201).json(newProduct);
    } catch (error) {
      res.status(500).json({ error: "Failed to save product" });
    }
  });

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
