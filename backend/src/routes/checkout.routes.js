import { Router } from "express";
import {
    validateCart,
    createOrder,
} from "../controllers/checkout.controller.js";

const router = Router();

router.post("/validate", validateCart);

router.post("/order", createOrder);

export default router;