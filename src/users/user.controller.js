import User from './user.model.js';
import { hash, verify } from 'argon2';
import { generateJWT } from '../helpers/generate-jwt.js';
import { request, response } from 'express';

export const login = async (req, res) => {

    const { email, password, username } = req.body;

    try {
        const lowerEmail = email ? email.toLowerCase() : null;
        const lowerUsername = username ? username.toLowerCase() : null;

        //convertir email y username a minusculas asi no me da problemas
        const user = await User.findOne({
            $or: [
                { email: lowerEmail },
                { username: lowerUsername }
            ]
        });

        //por si ingresan un email o username que no existe en la base de datos
        if (!user) {
            return res.status(400).json({
                success: false,
                msg: 'Incorrect credentials, email or username does not exist in the database'
            });
        }

        //por si el usuario esta desactivado
        if (user.estado === false) {
            return res.status(400).json({
                success: false,
                msg: 'Error user disabled'
            });
        }

        //por si la contraseña no es la correcta
        const validPassword = await verify(user.password, password);
        if (!validPassword) {
            return res.status(400).json({
                success: false,
                msg: 'Incorrect password'
            });
        }

        const token = await generateJWT(user.id);

        res.status(200).json({
            success: true,
            msg: '¡¡Login successful!!',
            userDetails: {
                username: user.username,
                token: token
            }
        });

    } catch (e) {
        return res.status(500).json({
            success: false,
            msg: 'Error user could not be logged in',
            error: e.message
        });
    }
}

export const register = async (req, res) => {
    try {

        const data = req.body;

        const encryptedPassword = await hash(data.password);

        const user = await User.create({
            name: data.name,
            surname: data.surname,
            username: data.username,
            email: data.email,
            phone: data.phone,
            password: encryptedPassword
        });

        res.status(200).json({
            success: true,
            msg: '¡¡User Registration successful!!',
            userDetails: {
                username: user.username
            }
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: 'Error user registration failded',
            error: error.message
        });
    }
}

export const getUsers = async (req = request, res = response) => {
    try {

        const { limite = 10, desde = 0 } = req.body;
        const query = { estado: true };

        const [ total, users ] = await Promise.all([
            User.countDocuments(query),
            User.find(query)
            .skip(Number(desde))
            .limit(Number(limite))
        ])

        res.status(200).json({
            success: true,
            total,
            users
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: 'Error getting users',
            error
        });
    }
}

export const getUserById = async (req, res) => {
    try {

        const { id } = req.params;

        const user = await User.findById(id);

        //por si ingresan un id de usuario que no existe en la base de datos
        if (!user) {
            return res.status(400).json({
                success: false,
                msg: 'User not found'
            });
        }

        //por si el usuario esta desactivado
        if (user.estado === false) {
            return res.status(400).json({
                success: false,
                msg: 'Error user disabled'
            });
        }

        res.status(200).json({
            success: true,
            user
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: 'Error getting user by ID',
            error
        });
    }
}

export const updateUser = async (req, res = response) => {
    try {

        const { id } = req.params;
        const { _id, email, role, password, currentPassword, ...data } = req.body;
        let { username } = req.body;

        // por si ingresan el username que se actualize en minusculas
        if (username) {
            username = username.toLowerCase();
            data.username = username;
        }

        // para que no puedan actualizar al admin por defecto
        const user = await User.findById(id);
        if (user.username === "administrador") {
            return res.status(400).json({
                success: false,
                msg: 'You cannot update the main ADMIN'
            });
        }
        
        //que solo puedan actualizar su propio perfil y no el de otros (los administradores puse que si puedan hacer todo)
        if (req.user.id !== id && req.user.role !== "ADMIN") {
            return res.status(400).json({
                success: false,
                msg: 'You do not have permissions to update a profile that is not yours'
            });
        }

        //es para validar que si introducen un usuario que no es el suyo pero existe en la base de datos de error, pero si no existe entonces que si actualize
        if (username !== user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    msg: `The username ${ username } already exists in the database`
                });
            }
        }
        
        //por si ingresan un id de un usuario que no existe en la base de datos
        if (!user) {
            return res.status(400).json({
                success: false,
                msg: 'User not found'
            });
        }

        //por si el usuario esta desactivado
        if (user.estado === false) {
            return res.status(400).json({
                success: false,
                msg: 'Error user disabled'
            });
        }

        //validar que la contraseña sea correcta para poder actualizarla
        if (password) {
            if (!currentPassword) {
                return res.status(400).json({
                    success: false,
                    msg: 'You must provide the current password to change it'
                });
            }

            const verifyPassword = await verify(user.password, currentPassword);

            if (!verifyPassword) {
                return res.status(400).json({
                    success: false,
                    msg: 'Incorrect current password'
                });
            }

            data.password = await hash(password);
        }

        const updateUser = await User.findByIdAndUpdate(id, data, {new: true});

        res.status(200).json({
            success: true,
            msg: 'User updated successfully',
            updateUser
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: 'Error updating user',
            error
        });
    }
}

export const updateRole = async (req, res = response) => {
    try {

        const { id } = req.params;
        let { role } = req.body;

        //es para que solo los administradores puedan cambiar el role de los demas usuarios
        if (req.user.role !== "ADMIN") {
            return res.status(400).json({
                success: false,
                msg: 'You do not have permissions to update user roles'
            });
        }

        //para que no puedan cambiarle el role al admin por defecto
        const user = await User.findById(id);
        if (user.username === "administrador") {
            return res.status(400).json({
                success: false,
                msg: 'You cannot update the main ADMIN'
            });
        }

        //por si ingresan un id de un usuario que no existe en la base de datos
        if (!user) {
            return res.status(400).json({
                success: false,
                msg: 'User not found'
            });
        }
        
        //por si el usuario esta desactivado
        if (user.estado === false) {
            return res.status(400).json({
                success: false,
                msg: 'Error user disabled'
            });
        }
        
        const roleUpdate = await User.findByIdAndUpdate(id, { role }, { new: true });
        
        res.status(200).json({
            success: true,
            msg: 'User role updated successfully',
            roleUpdate
        });
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            msg: 'Error updating user role',
            error
        });
    }
}

export const deleteUser = async (req, res = response) => {
    try {

        const { id } = req.params;
        const { password, username } = req.body;
        
        const authenticatedUser = req.user;
        
        const user = await User.findById(id);
        
        //para que no puedan eliminar al admin por defecto
        if (user.username === "administrador") {
            return res.status(400).json({
                success: false,
                msg: 'You cannot delete the main ADMIN'
            });
        }

        //que solo puedan eliminar su propio perfil y no el de otros (los administradores puse que si puedan hacer todo)
        if (req.user.id !== id && req.user.role !== "ADMIN") {
            return res.status(400).json({
                success: false,
                msg: 'You do not have permissions to delete a profile that is not yours'
            });
        }
        
        //por si ingresan un id de un usuario que no existe en la base de datos
        if (!user) {
            return res.status(400).json({
                success: false,
                msg: 'User not found'
            });
        }
        
        //por si el usuario ya esta desactivado
        if (user.estado === false) {
            return res.status(400).json({
                success: false,
                msg: 'The user is already disabled'
            });
        }

        //validar que si ingresen el username para poder eliminarlo (parametro de seguridad)
        if (!username) {
            return res.status(400).json({
                success: false,
                msg: 'You must provide the username to delete it'
            });
        }

        //validar que si ingresen la contraseña para poder eliminarlo (parametro de seguridad)
        if (!password) {
            return res.status(400).json({
                success: false,
                msg: 'You must provide the password to delete it'
            });
        }

        //por si ingresan un username que no es el suyo
        if (user.username !== username) {
            return res.status(400).json({
                success: false,
                msg: 'Incorrect username'
            });
        }

        //validar que la contraseña sea correcta para poder eliminarlo
        const validPassword = await verify(user.password, password);
        if (!validPassword) {
            return res.status(400).json({
                success: false,
                msg: 'Incorrect password'
            });
        }
        
        const userDelete = await User.findByIdAndUpdate(id, { estado: false }, { new: true });

        res.status(200).json({
            success: true,
            msg: 'User deleted successfully',
            userDelete,
            authenticatedUser
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: 'Error deleting user',
            error
        });
    }
}

export const restoreUser = async (req, res = response) => {
    try {

        const { id } = req.params;
        const { password, username } = req.body;
        
        const authenticatedUser = req.user;
        
        const user = await User.findById(id);

        //para que solo los admin puedan restaurar usuarios
        if (req.user.role !== "ADMIN") {
            return res.status(400).json({
                success: false,
                msg: 'You do not have permissions to enabled'
            });
        }
        
        //por si ingresan un id de un usuario que no existe en la base de datos
        if (!user) {
            return res.status(400).json({
                success: false,
                msg: 'User not found'
            });
        }
        
        //por si el usuario ya esta habilitado
        if (user.estado === true) {
            return res.status(400).json({
                success: false,
                msg: 'The user is already enabled'
            });
        }

        //por si no ingresan el username del usuario (parametro de seguridad)
        if (!username) {
            return res.status(400).json({
                success: false,
                msg: 'You must provide the username to restore it'
            });
        }

        //por si no ingresan la contraseña del usuario (parametro de seguridad)
        if (!password) {
            return res.status(400).json({
                success: false,
                msg: 'You must provide the password to restore it'
            });
        }

        //por si ingresan un username que no es el de ese usuario
        if (user.username !== username) {
            return res.status(400).json({
                success: false,
                msg: 'Incorrect username'
            });
        }
        
        //validar que la contraseña sea correcta para poder habilitarlo
        const validPassword = await verify(user.password, password);
        if (!validPassword) {
            return res.status(400).json({
                success: false,
                msg: 'Incorrect password'
            });
        }
        
        const userRestore = await User.findByIdAndUpdate(id, { estado: true }, { new: true });

        res.status(200).json({
            success: true,
            msg: 'User restore successfully',
            userRestore,
            authenticatedUser
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: 'Error restore user',
            error
        });
    }
}

export const createAdmin = async () => {
    try {

        //verificar que si el usuario admin por defecto existe en la base de datos, si no lo crea
        const verifyUser = await User.findOne({ username: "Administrador".toLowerCase() });
        if (!verifyUser) {
            const encryptedPassword = await hash("Admin100");
            const adminUser = await User.create({
                name: "Ian",
                surname: "Alfaro",
                username: "Administrador".toLowerCase(),
                email: "admin@gmail.com",
                phone: "78212654",
                password: encryptedPassword,
                role: "ADMIN"
            });

            await adminUser.save();

            console.log(" ");
            console.log("ADMIN user created successfully");
            console.log(" ");
        } else {
            console.log(" ");
            console.log("The ADMIN user already exists, it was not created again");
            console.log(" ");
        }
        
    } catch (error) {
        console.log(" ");
        console.error('Error creating ADMIN user: ', error);
        console.log(" ");
    }
}