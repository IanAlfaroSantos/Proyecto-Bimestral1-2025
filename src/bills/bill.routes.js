import { Router } from "express";
import { check } from "express-validator";
import { validarJWT } from "../middlewares/validar-jwt.js";
import { existeBillById } from "../helpers/db-validator.js";
import { validarCampos } from "../middlewares/validar-campos.js";
import { generateBill } from "./bill.controller.js";

const router = Router();

router.post(
    "/:id",
    validarJWT,
    generateBill
);

router.get(
    "/:id",
    [
        validarJWT,
        check("id", "Invalid ID").not().isEmpty(),
        check("id").custom(existeBillById),
        validarCampos
    ],
    getBillById
);

export default router;