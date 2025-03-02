import User from "../users/user.model.js";
import Category from "../categories/category.model.js";

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