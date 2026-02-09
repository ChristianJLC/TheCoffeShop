
import "dotenv/config"; 

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import checkoutRoutes from "./routes/checkout.routes.js";
import mpRoutes from "./routes/mp.routes.js";
import ordersRoutes from "./routes/orders.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRONTEND_DIR = path.join(__dirname, "../../frontend");
app.use(express.static(FRONTEND_DIR));

app.get("/", (req, res) => {
    res.redirect("/vistas/index.html");
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

//API Routes
app.use("/api/checkout", checkoutRoutes);
app.use("/api/mp", mpRoutes);
app.use("/api/orders", ordersRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Backend corriendo en puerto", PORT));
