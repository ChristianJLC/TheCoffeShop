import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRONTEND_DIR = path.join(__dirname, "../../frontend");
app.use(express.static(FRONTEND_DIR));

app.get("/", (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, "vistas", "index.html"));
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Backend corriendo en puerto", PORT));
