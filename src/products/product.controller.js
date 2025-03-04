import Product from "./product.model.js";
import Category from "../categories/category.model.js";
import { request, response } from "express";

export const saveProduct = async (req, res) => {
    try {

        const data = req.body;
        const category = await Category.findOne({ name: data.name.toLowerCase() });

        if (!category) {
            console.log(category);
            return res.status(400).json({
                success: false,
                msg: "Category not found"
            });
        }

        if (req.user.role !== "ADMIN") {
            return res.status(400).json({
                success: false,
                msg: "You do not have permission to save products"
            });
        }

        const product = await Product.create({
            ...data,
            category: category._id,
            nameCategory: category.name
        });

        const detailsProduct = await Product.findById(product._id)
            .populate('category', 'name');

        const details = {
            detailsProduct: {
                detailsProduct
            }
        }

        res.status(200).json({
            success: true,
            msg: "Product saved successfully",
            details
        });
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            msg: "Error saving product",
            error
        });
    }
}

export const getProducts = async (req = request, res = response) => {
    try {

        const { limite = 10, desde = 0, category, stock, nameProduct } = req.query;
        const query = { estado: true };

        if (nameProduct) {
            query.nameProduct = nameProduct.toLocaleLowerCase();
        }

        if (category) {
            const categoryName = await Category.findOne({ name: category.toLowerCase() });
            if (categoryName) {
                query.category = categoryName._id;
            } else {
                return res.status(400).json({
                    success: false,
                    msg: "Category not found"
                });
            }
        }

        let sort = {};
        if (stock === "0") {
            query.stock = 0;
        } else if (stock === "1") {
            sort.stock = 1;
        }

        const [total, products ] = await Promise.all([
            Product.countDocuments(query),
            Product.find(query)
            .populate('category', 'name')
            .sort(sort)
            .skip(Number(desde))
            .limit(Number(limite))
        ]);

        res.status(200).json({
            success: true,
            total,
            products
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: "Error getting products",
            error
        });
    }
}

export const getProductById = async (req, res) => {
    try {

        const { id } = req.params;

        const product = await Product.findById(id)
        .populate('category', 'name');
        
        if (!product) {
            return res.status(400).json({
                success: false,
                msg: "Product not found"
            });
        }

        if (product.estado === false) {
            return res.status(400).json({
                success: false,
                msg: "This product is not available"
            });
        }

        res.status(200).json({
            success: true,
            product
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: "Error search product by ID",
            error
        });
    }
}

export const updateProduct = async (req, res = response) => {
    try {

        const { id } = req.params;
        const { _id, ...data } = req.body;
        let { nameProduct } = req.body;
        let { name } = req.body;

        if (nameProduct) {
            nameProduct = nameProduct.toLowerCase();
            data.nameProduct = nameProduct;
        }

        if (name) {
            name = name.toLowerCase();
            data.name = name;
        }

        if (req.user.role !== "ADMIN") {
            return res.status(400).json({
                success: false,
                msg: "You do not have permission to update products"
            });
        }

        const product = await Product.findById(id);
        if (!product) {
            return res.status(400).json({
                success: false,
                msg: "Product not found"
            });
        }

        if (product.estado === false) {
            return res.status(400).json({
                success: false,
                msg: "This product is not available"
            });
        }

        const category = await Category.findOne({ name });
        if (!category) {
            return res.status(400).json({
                success: false,
                msg: "Category not found"
            });
        }
        
        data.category = category._id;

        await Product.findByIdAndUpdate(id, data, { new: true });

        const detailsProduct = await Product.findById(id)
            .populate('category', 'name');

        const details = {
            detailsProduct: {
                detailsProduct
            }
        }

        res.status(200).json({
            success: true,
            msg: "Product updated successfully",
            details
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: "Error updating product",
            error
        });
    }
}

export const deleteProduct = async (req, res = response) => {
    try {

        const { id } = req.params;

        const authenticatedUser = req.user;

        if (req.user.role !== "ADMIN") {
            return res.status(400).json({
                success: false,
                msg: "You do not have permission to delete products"
            });
        }

        const product = await Product.findById(id);
        if (!product) {
            return res.status(400).json({
                success: false,
                msg: "Product not found"
            });
        }

        if (product.estado === false) {
            return res.status(400).json({
                success: false,
                msg: "The user is already disabled"
            });
        }

        const deleteProduct = await Product.findByIdAndUpdate(id, { estado: false }, { new: true });

        res.status(200).json({
            success: true,
            msg: "Product deleted successfully",
            deleteProduct,
            authenticatedUser
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: "Error deleting product",
            error
        });
    }
}

export const restoreProduct = async (req, res = response) => {
    try {

        const { id } = req.params;

        const authenticatedUser = req.user;

        if (req.user.role!== "ADMIN") {
            return res.status(400).json({
                success: false,
                msg: "You do not have permission to restore products"
            });
        }

        const product = await Product.findById(id);
        if (!product) {
            return res.status(400).json({
                success: false,
                msg: "Product not found"
            });
        }

        if (product.estado === true) {
            return res.status(400).json({
                success: false,
                msg: "The product is already enabled"
            });
        }

        const restoreProduct = await Product.findByIdAndUpdate(id, { estado: true }, { new: true });

        res.status(200).json({
            success: true,
            msg: "Product restored successfully",
            restoreProduct,
            authenticatedUser
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: "Error restoring product",
            error
        });
    }
}