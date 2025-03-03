import { Router } from "express";
import { check } from "express-validator";
import { existeProductById } from "../helpers/db-validator.js";
import { validarCampos } from "../middlewares/validar-campos.js";
import { validarJWT } from "../middlewares/validar-jwt.js";
import { validatorProduct } from "../middlewares/validator.js";
import { saveProduct, getProducts, getProductById, updateProduct, deleteProduct, restoreProduct } from "./product.controller.js";

const router = Router();

router.post(
    '/',
    validarJWT,
    validatorProduct,
    saveProduct
);

router.get(
    '/',
    getProducts
);

router.get(
    '/:id',
    [
        check('id', 'Invalid ID').isMongoId(),
        check('id').custom(existeProductById),
        validarCampos
    ],
    getProductById
);

router.put(
    '/:id',
    [
        validarJWT,
        check('id', 'Invalid ID').isMongoId(),
        check('id').custom(existeProductById),
        validarCampos
    ],
    updateProduct
);

router.put(
    '/restore/:id',
    [
        validarJWT,
        check('id', 'Invalid ID').isMongoId(),
        check('id').custom(existeProductById),
        validarCampos
    ],
    restoreProduct
);

router.delete(
    '/:id',
    [
        validarJWT,
        check('id', 'Invalid ID').isMongoId(),
        check('id').custom(existeProductById),
        validarCampos
    ],
    deleteProduct
);

export default router;