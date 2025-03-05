import { Router } from "express";
import { validarJWT } from "../middlewares/validar-jwt.js"
import { generateBill } from "./bill.controller.js";

const router = Router();

router.post(
    "/:id",
    validarJWT,
    generateBill
);

export default router;