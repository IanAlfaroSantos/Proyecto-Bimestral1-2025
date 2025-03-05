import { Router } from "express";
import { check } from "express-validator";
import { validarJWT } from "../middlewares/validar-jwt.js";
import { existeUserById, existeBillById } from "../helpers/db-validator.js";
import { validarCampos } from "../middlewares/validar-campos.js";
import { generateBill, getBillUserById, getBillById, updateBill } from "./bill.controller.js";

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
        check("id").custom(existeUserById),
        validarCampos
    ],
    getBillUserById
);

router.get(
    "/admin/:id",
    [
        validarJWT,
        check("id", "Invalid ID").not().isEmpty(),
        check("id").custom(existeBillById),
        validarCampos
    ],
    getBillById
);

router.put(
    "/:id",
    [
        validarJWT,
        check("id", "Invalid ID").not().isEmpty(),
        check("id").custom(existeBillById),
        validarCampos
    ],
    updateBill
);

export default router;