import Category from "./category.model.js";
import Product from "../products/product.model.js";
import { request, response } from "express";

export const saveCategory = async (req, res) => {
    try {

        const data = req.body;

        //este verifica que solo los administradores puedan agregar categorias
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

        //Este verifica que solo los administradores puedan ver las categorias
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

        //Este verifica que solo los administradores puedan buscar las categorias por medio del id
        if (req.user.role !== "ADMIN") {
            return res.status(400).json({
                success: false,
                msg: "You do not have permission to search categories by ID"
            })
        }

        //por si ingresan un id de categoria que no existe en la base de datos
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                msg: "Category not found"
            });
        }

        //por si la categoria no esta disponible
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

        //por si ingresan el nombre de la categoria que se actualize en minusculas
        if (name) {
            name = name.toLowerCase();
            data.name = name;
        }

        //por si ingresan un id de categoria que no existe en la base de datos
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                msg: "Category not found"
            });
        }

        //para que no puedan actualizar la categoria por defecto
        const categoryGeneral = await Category.findOne({ name: "General".toLowerCase() });
        if (categoryGeneral && id === categoryGeneral._id.toString()) {
            return res.status(400).json({
                success: false,
                msg: "You cannot update the category default General"
            });
        }

        //por si la categoria no esta disponible
        if (category.estado === false) {
            return res.status(400).json({
                success: false,
                msg: "This category is not available"
            });
        }

        //este verifica que solo los administradores puedan actualizar las categorias
        if (req.user.role !== "ADMIN") {
            return res.status(400).json({
                success: false,
                msg: "You do not have permission to update this category"
            });
        }

        //es para validar que si introducen un nombre de categoria que no es el mismo al que tiene pero que existe en la base de datos de error, pero si no existe entonces que si actualize
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

        //este verifica que solo los administradores puedan eliminar una categoria
        if (req.user.role !== "ADMIN") {
            return res.status(400).json({
                success: false,
                msg: "You do not have permission to delete this category"
            });
        }

        //por si ingresan un id de categoria que no existe en la base de datos
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                msg: "Category not found"
            });
        }

        //por si la categoria ya esta eliminada
        if (category.estado === false) {
            return res.status(400).json({
                success: false,
                msg: "The category is already disabled"
            });
        }

        //para que no puedan eliminar la categoria por defecto
        const categoryGeneral = await Category.findOne({ name: "General".toLowerCase() });
        if (categoryGeneral && id === categoryGeneral._id.toString()) {
            return res.status(400).json({
                success: false,
                msg: "You cannot delete the category default General"
            });
        }

        await Product.updateMany(
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

        //este verifica que solo los administradores puedan restaurar una categoria
        if (req.user.role !== "ADMIN") {
            return res.status(400).json({
                success: false,
                msg: "You do not have permission to restore this category"
            });
        }

        //por si ingresan un id de categoria que no existe en la base de datos
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                msg: "Category not found"
            });
        }

        //por si la categoria ya se restauro
        if (category.estado === true) {
            return res.status(400).json({
                success: false,
                msg: "The category is already enabled"
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

        //Verifica si la categoria por defecto existe en la base de datos, si no la crea
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