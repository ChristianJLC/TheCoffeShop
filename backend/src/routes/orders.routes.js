import { Router } from "express";
import { getOrder, updateOrderStatus } from "../controllers/orders.controller.js";

const router = Router();


router.get("/:id", getOrder);


router.post("/:id/status", updateOrderStatus);

export default router;
