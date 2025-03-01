import { Router } from "express";
import { check } from "express-validator";
import { existeUserById } from "../helpers/db-validator.js";
import { validarCampos } from "../middlewares/validar-campos.js";
import { validarJWT } from "../middlewares/validar-jwt.js";
import { deleteFileOnError } from "../middlewares/delete-file-on-error.js"
import { validatorRegister, validatorLogin } from "../middlewares/validator.js";
import { login, register, getUsers, getUserById, updateUser, updateRole, deleteUser, restoreUser } from "./user.controller.js";

const router = Router();

router.post(
    "/login",
    validatorLogin,
    deleteFileOnError,
    login
);

router.post(
    "/register",
    validatorRegister,
    deleteFileOnError,
    register
);

router.get(
    "/",
    getUsers
);

router.get(
    "/:id",
    [
        check("id", "Invalid ID").not().isEmpty(),
        check("id").custom(existeUserById),
        validarCampos,
    ],
    getUserById
);

router.put(
    "/:id",
    [
        validarJWT,
        check("id", "Invalid ID").not().isEmpty(),
        check("id").custom(existeUserById),
        validarCampos,
    ],
    updateUser
);

router.put(
    "/role/:id",
    [
        validarJWT,
        check("id", "Invalid ID").not().isEmpty(),
        check("id").custom(existeUserById),
        check("role", "Invalid role. Valid role are: ADMIN or CLIENT").isIn(["ADMIN", "CLIENT"]),
        validarCampos,
    ],
    updateRole
);

router.put(
    "/restore/:id",
    [
        validarJWT,
        check("id", "Invalid ID").not().isEmpty(),
        check("id").custom(existeUserById),
        validarCampos,
    ],
    restoreUser
);

router.delete(
    "/:id",
    [
        validarJWT,
        check("id", "Invalid ID").not().isEmpty(),
        check("id").custom(existeUserById),
        validarCampos,
    ],
    deleteUser
);

export default router;