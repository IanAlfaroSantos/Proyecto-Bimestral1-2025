import Category from "./category.model.js";
import Product from "../products/product.model.js";
import { request, response } from "express";

export const saveCategory = async (req, res) => {
    try {

        const data = req.body;

        if (req.user.role !== "ADMIN") {
            return res.status(400).json({
                success: false,
                msg: "You do not have permission to save categories"
            });
        }

        const category = await Category.create({
            name: data.name,
            description: data.description
        });

        res.status(200).json({
            success: true,
            msg: "Category saved successfully",
            category
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: "Error saving category",
            error
        });
    }
}

export const getCategories = async (req = request, res = response) => {
    try {

        const { limite = 10, desde = 0 } = req.body;
        const query = { estado: true };

        if (req.user.role !== "ADMIN") {
            return res.status(400).json({
                success: false,
                msg: "You do not have permission to get categories"
            })
        }

        const [ total, categories ] = await Promise.all([
            Category.countDocuments(query),
            Category.find(query)
               .skip(Number(desde))
               .limit(Number(limite))
        ]);

        res.status(200).json({
            success: true,
            total,
            categories
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: "Error getting categories",
            error
        });
    }
}

export const getCategoryById = async (req, res) => {
    try {

        const { id } = req.params;

        if (req.user.role !== "ADMIN") {
            return res.status(400).json({
                success: false,
                msg: "You do not have permission to search categories by ID"
            })
        }

        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                msg: "Category not found"
            });
        }

        if (category.estado === false) {
            return res.status(400).json({
                success: false,
                msg: "This category is not available"
            });
        }

        res.status(200).json({
            success: true,
            category
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: "Error search category by id",
            error
        });
    }
}

export const updateCategory = async (req, res = response) => {
    try {

        const { id } = req.params;
        const { _id, ...data } = req.body;
        let { name } = req.body;

        if (name) {
            name = name.toLowerCase();
            data.name = name;
        }

        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                msg: "Category not found"
            });
        }

        const categoryGeneral = await Category.findOne({ name: "General".toLowerCase() });

        if (categoryGeneral && id === categoryGeneral._id.toString()) {
            return res.status(400).json({
                success: false,
                msg: "You cannot update the category default General"
            });
        }

        if (category.estado === false) {
            return res.status(400).json({
                success: false,
                msg: "This category is not available"
            });
        }

        if (req.user.role !== "ADMIN") {
            return res.status(400).json({
                success: false,
                msg: "You do not have permission to update this category"
            });
        }

        if (name !== category.name) {
            const existingCategory = await Category.findOne({ name });

            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    msg: `The name ${ name } already exists in the database`
                });
            }
        }

        const updateCategory = await Category.findByIdAndUpdate(id, data, { new: true });

        res.status(200).json({
            success: true,
            msg: "Category updated successfully",
            updateCategory
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: "Error updating category",
            error
        });
    }
}

export const deleteCategory = async (req, res = response) => {
    try {

        const { id } = req.params;

        const authenticatedUser = req.user;

        if (req.user.role !== "ADMIN") {
            return res.status(400).json({
                success: false,
                msg: "You do not have permission to delete this category"
            });
        }

        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                msg: "Category not found"
            });
        }

        if (category.estado === false) {
            return res.status(400).json({
                success: false,
                msg: "The category is already disabled"
            });
        }

        const categoryGeneral = await Category.findOne({ name: "General".toLowerCase() });

        if (categoryGeneral && id === categoryGeneral._id.toString()) {
            return res.status(400).json({
                success: false,
                msg: "You cannot delete the category default General"
            });
        }

        const product = await Product.updateMany(
            { category: id },
            { $set: { category: categoryGeneral._id }}
        );

        const deleteCategory = await Category.findByIdAndUpdate(id, { estado: false }, { new: true });

        res.status(200).json({
            success: true,
            msg: "Category deleted successfully",
            deleteCategory,
            authenticatedUser
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: "Error deleting category",
            error
        });
    }
}

export const restoreCategory = async (req, res = response) => {
    try {

        const { id } = req.params;

        const authenticatedUser = req.user;

        if (req.user.role !== "ADMIN") {
            return res.status(400).json({
                success: false,
                msg: "You do not have permission to restore this category"
            });
        }

        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                msg: "Category not found"
            });
        }

        if (category.estado === true) {
            return res.status(400).json({
                success: false,
                msg: "The category is already enabled"
            });
        }

        const categoryGeneral = await Category.findOne({ name: "General".toLowerCase() });

        if (categoryGeneral && id === categoryGeneral._id.toString()) {
            return res.status(400).json({
                success: false,
                msg: "You cannot restore the category default General"
            });
        }

        const restoreCategory = await Category.findByIdAndUpdate(id, { estado: true }, { new: true });

        res.status(200).json({
            success: true,
            msg: "Category restored successfully",
            restoreCategory,
            authenticatedUser
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: "Error restored category",
            error
        });
    }
}

export const defaultCategory = async () => {
    try {

        const verifyCategory = await Category.findOne({ name: "General".toLowerCase() });
        
        if (!verifyCategory) {
            const categoryGeneral = new Category({
                name: "General",
                description: "Categoria por defecto para productos sin una categoria especifica"
            })

            await categoryGeneral.save();

            console.log("Category general created successfully");
            console.log(" ");
        } else {
            console.log("The category general already exists, it was not created again");
            console.log(" ");
        }
        
    } catch (error) {
        console.error("Error creating default category: ", error);
        console.log(" ");
    }
}