import User from "../users/user.model.js";
import Category from "../categories/category.model.js";
import Product from "../products/product.model.js";
import Bill from "../bills/bill.model.js"

export const existenteEmail = async (email = ' ') => {

    const existeEmail = await User.findOne({ email });

    if (existeEmail) {
        throw new Error(`The email ${ email } already exists in the database`);
    }
}

export const existenteUsername = async (username = ' ') => {

    const existeUsername = await User.findOne({ username });

    if (existeUsername) {
        throw new Error(`The username ${ username } already exists in the database`);
    }
}

export const existeUserById = async (id = '') => {
    
    const existeUser = await User.findById(id);
    
    if (!existeUser) {
        throw new Error(`The ID ${ id } does not exist in the database`);
    }
}

export const existenteName = async (name = ' ') => {

    const existeName = await Category.findOne({ name });

    if (existeName) {
        throw new Error(`The name ${ name } already exists in the database`);
    }
}

export const existeCategoryById = async (id = '') => {

    const existeCategory = await Category.findById(id);

    if (!existeCategory) {
        throw new Error(`The ID ${ id } does not exist in the database`);
    }
}

export const existenteNameProduct = async (name = ' ') => {

    const existeName = await Product.findOne({ name });

    if (existeName) {
        throw new Error(`The name ${ name } already exists in the database`);
    }
}

export const existeProductById = async (id = '') => {

    const existeProduct = await Product.findById(id);

    if (!existeProduct) {
        throw new Error(`The ID ${ id } does not exist in the database`);
    }
}

export const existeBillById = async (id = '') => {

    const existeBill = await Bill.findById(id);

    if (!existeBill) {
        throw new Error(`The ID ${ id } does not exist in the database`);
    }
}