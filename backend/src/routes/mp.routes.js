import { Router } from "express";
import { mpWebhook } from "../controllers/mp.controller.js";

const router = Router();

// MercadoPago Webhook
router.post("/webhook", mpWebhook);

export default router;
