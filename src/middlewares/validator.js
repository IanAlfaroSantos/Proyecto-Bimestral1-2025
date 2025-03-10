import { body } from "express-validator";
import { validarCampos } from "./validar-campos.js";
import { existenteEmail, existenteUsername, existenteName, existenteNameProduct } from "../helpers/db-validator.js";

export const validatorRegister = [
    body('name', 'The name is required').not().isEmpty(),
    body('surname', 'The surname is required').not().isEmpty(),
    body('email', 'You must enter a valid email').isEmail(),
    body('email').custom(existenteEmail),
    body('username').custom(existenteUsername),
    body('password', 'Password must be at least 8 characters').isLength({ min: 8 }),
    validarCampos
];

export const validatorLogin = [
    body('email').optional().isEmail().withMessage('Enter a valid email address'),
    body('username').optional().isString().withMessage('Enter a valid username'),
    body('password', 'Password must be at least 8 characters').isLength({ min: 8 })
];

export const validatorCategory = [
    body('name', 'The name is required').not().isEmpty(),
    body('name').custom(existenteName),
    body('description', 'The description is required').not().isEmpty(),
    body('description', 'The description is more than 50 characters').isLength({ max: 50 }),
    validarCampos
];

export const validatorProduct = [
    body('nameProduct', 'The name is required').not().isEmpty(),
    body('nameProduct').custom(existenteNameProduct),
    body('description', 'The description is required').not().isEmpty(),
    body('description', 'The description is more than 50 characters').isLength({ max: 200 }),
    body('price', 'The price is required').not().isEmpty(),
    body('price').isNumeric(),
    body('stock', 'The stock is required').not().isEmpty(),
    body('stock').isNumeric(),
    body('name', 'The category is required').not().isEmpty(),
    validarCampos
];