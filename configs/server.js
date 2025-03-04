'use strict';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { dbConnection } from './mongo.js';
import limiter from '../src/middlewares/validar-cant-peticiones.js';
import { createAdmin } from '../src/users/user.controller.js';
import userRoutes from "../src/users/user.routes.js";
import { defaultCategory } from '../src/categories/category.controller.js';
import categoryRoutes from "../src/categories/category.routes.js";
import productRoutes from "../src/products/product.routes.js";
import cartRoutes from "../src/cart/cart.routes.js";

const middlewares = (app) => {
    app.use(express.urlencoded({ extended: false }));
    app.use(cors());
    app.use(express.json());
    app.use(helmet());
    app.use(morgan('dev'));
    app.use(limiter);
}

const routes = (app) => {
    app.use("/onlineSale/v1/users", userRoutes);
    app.use("/onlineSale/v1/categories", categoryRoutes);
    app.use("/onlineSale/v1/products", productRoutes);
    app.use("/onlineSale/v1/cart", cartRoutes);
};

const conectarDB = async () => {
    try {
        await dbConnection();
        console.log('¡¡Conexión a la base de datos exitosa!!');
        await createAdmin();
        await defaultCategory();
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
        process.exit(1);
    }
}

export const initServer = async () => {
    const app = express();
    const port = process.env.PORT || 3000;

    try {
        middlewares(app);
        conectarDB();
        routes(app);
        app.listen(port);
        console.log(`Server running on port ${port}`);
    } catch (error) {
        console.log(`Server init failded: ${error}`);
    }
}