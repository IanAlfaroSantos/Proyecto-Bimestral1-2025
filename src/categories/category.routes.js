import { Router } from "express";
import { check } from "express-validator";
import { existeCategoryById } from "../helpers/db-validator.js";
import { validarCampos } from "../middlewares/validar-campos.js";
import { validarJWT } from "../middlewares/validar-jwt.js";
import { validatorCategory } from "../middlewares/validator.js";
import { saveCategory, getCategories, getCategoryById, updateCategory, deleteCategory, restoreCategory } from "./category.controller.js";

const router = Router();

router.post(
    '/',
    validarJWT,
    validatorCategory,
    validarCampos,
    saveCategory
);

router.get(
    '/',
    validarJWT,
    getCategories
);

router.get(
    '/:id',
    [
        validarJWT,
        check('id', 'Invalid ID').isMongoId(),
        check('id').custom(existeCategoryById),
        validarCampos
    ],
    getCategoryById
);

router.put(
    '/:id',
    [
        validarJWT,
        check('id', 'Invalid ID').isMongoId(),
        check('id').custom(existeCategoryById),
        validarCampos
    ],
    updateCategory
);

router.put(
    '/restore/:id',
    [
        validarJWT,
        check('id', 'Invalid ID').isMongoId(),
        check('id').custom(existeCategoryById),
        validarCampos
    ],
    restoreCategory
);

router.delete(
    '/:id',
    [
        validarJWT,
        check('id', 'Invalid ID').isMongoId(),
        check('id').custom(existeCategoryById),
        validarCampos
    ],
    deleteCategory
);

export default router;