import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const PRODUCTS_FILE = path.join(process.cwd(), "products.json");

  const DEFAULT_PRODUCTS = [
    {
      "id": 1,
      "name": "Premium Wireless Headphones",
      "price": 299.99,
      "category": "Accessories",
      "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"
    },
    {
      "id": 2,
      "name": "Minimalist Smart Watch",
      "price": 199.5,
      "category": "Accessories",
      "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"
    },
    {
      "id": 3,
      "name": "Mechanical Gaming Keyboard",
      "price": 129,
      "category": "Gaming",
      "image": "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800&q=80"
    },
    {
      "id": 4,
      "name": "Ultra-wide Curved Monitor",
      "price": 499.99,
      "category": "Electronics",
      "image": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80"
    },
    {
      "id": 5,
      "name": "Pro DSLR Camera",
      "price": 1299.99,
      "category": "Electronics",
      "image": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80"
    },
    {
      "id": 6,
      "name": "Ergonomic Office Chair",
      "price": 349.00,
      "category": "Furniture",
      "image": "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=800&q=80"
    },
    {
      "id": 7,
      "name": "Smart Home Hub",
      "price": 89.99,
      "category": "Electronics",
      "image": "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=80"
    },
    {
      "id": 8,
      "name": "Leather Travel Bag",
      "price": 159.50,
      "category": "Accessories",
      "image": "https://images.unsplash.com/photo-1547949003-9792a18a2601?w=800&q=80"
    },
    {
      "id": 9,
      "name": "Wireless Charging Pad",
      "price": 39.99,
      "category": "Accessories",
      "image": "https://images.unsplash.com/photo-1586816832753-101af6fe2f84?w=800&q=80"
    },
    {
      "id": 10,
      "name": "Noise Cancelling Earbuds",
      "price": 149.99,
      "category": "Accessories",
      "image": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80"
    }
  ];

  async function ensureProductsFile() {
    try {
      await fs.access(PRODUCTS_FILE);
      const data = await fs.readFile(PRODUCTS_FILE, "utf-8");
      if (!data || JSON.parse(data).length === 0) {
        await fs.writeFile(PRODUCTS_FILE, JSON.stringify(DEFAULT_PRODUCTS, null, 2));
      }
    } catch {
      await fs.writeFile(PRODUCTS_FILE, JSON.stringify(DEFAULT_PRODUCTS, null, 2));
    }
  }

  await ensureProductsFile();

  app.use(express.json());

  // API Routes
  app.get("/api/products", async (req, res) => {
    try {
      const data = await fs.readFile(PRODUCTS_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      console.error("Error reading products:", error);
      res.status(500).json({ error: "Failed to read products" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const { name, price, image, category } = req.body;
      if (!name || isNaN(parseFloat(price))) {
        return res.status(400).json({ error: "Valid name and price are required" });
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
      console.error("Error saving product:", error);
      res.status(500).json({ error: "Failed to save product" });
    }
  });

  app.post("/api/products/reset", async (req, res) => {
    try {
      await fs.writeFile(PRODUCTS_FILE, JSON.stringify(DEFAULT_PRODUCTS, null, 2));
      res.json({ message: "Products reset to defaults", products: DEFAULT_PRODUCTS });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset products" });
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
