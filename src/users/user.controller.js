import User from './user.model.js';
import { hash, verify } from 'argon2';
import { generateJWT } from '../helpers/generate-jwt.js';
import { request, response } from 'express';

export const login = async (req, res) => {

    const { email, password, username } = req.body;

    try {
        const lowerEmail = email ? email.toLowerCase() : null;
        const lowerUsername = username ? username.toLowerCase() : null;

        const user = await User.findOne({
            $or: [
                { email: lowerEmail },
                { username: lowerUsername }
            ]
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                msg: 'Incorrect credentials, email or username does not exist in the database'
            });
        }

        if (user.estado === false) {
            return res.status(400).json({
                success: false,
                msg: 'Error user disabled'
            });
        }

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

        if (!user) {
            return res.status(400).json({
                success: false,
                msg: 'User not found'
            });
        }

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

        if (username) {
            username = username.toLowerCase();
            data.username = username;
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(400).json({
                success: false,
                msg: 'User not found'
            });
        }

        if (user.estado === false) {
            return res.status(400).json({
                success: false,
                msg: 'Error user disabled'
            });
        }

        if (user.username === "administrador") {
            return res.status(400).json({
                success: false,
                msg: 'You cannot update the main ADMIN'
            });
        }
        
        if (req.user.id !== id && req.user.role !== "ADMIN") {
            return res.status(400).json({
                success: false,
                msg: 'You do not have permissions to update a profile that is not yours'
            });
        }

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

        if (req.user.role !== "ADMIN") {
            return res.status(400).json({
                success: false,
                msg: 'You do not have permissions to update user roles'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(400).json({
                success: false,
                msg: 'User not found'
            });
        }
        
        if (user.estado === false) {
            return res.status(400).json({
                success: false,
                msg: 'Error user disabled'
            });
        }
        
        if (user.username === "administrador") {
            return res.status(400).json({
                success: false,
                msg: 'You cannot update the main ADMIN'
            });
        }
        
        const roleUpdate = await User.findByIdAdnUpdate(id, { role }, { new: true });
        
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
        
        const authenticatedUser = req.user;
        
        const user = await User.findById(id);
        
        if (!user) {
            return res.status(400).json({
                success: false,
                msg: 'User not found'
            });
        }
        
        if (user.estado === false) {
            return res.status(400).json({
                success: false,
                msg: 'The user is already disabled'
            });
        }
        
        if (user.username === "administrador") {
            return res.status(400).json({
                success: false,
                msg: 'You cannot update the main ADMIN'
            });
        }

        if (req.user.id !== id && req.user.role !== "ADMIN") {
            return res.status(400).json({
                success: false,
                msg: 'You do not have permissions to delete a profile that is not yours'
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
        
        const authenticatedUser = req.user;
        
        const user = await User.findById(id);
        
        if (!user) {
            return res.status(400).json({
                success: false,
                msg: 'User not found'
            });
        }
        
        if (user.estado === true) {
            return res.status(400).json({
                success: false,
                msg: 'The user is already enabled'
            });
        }
        
        if (user.username === "administrador") {
            return res.status(400).json({
                success: false,
                msg: 'You cannot update the main ADMIN'
            });
        }

        if (req.user.role !== "ADMIN") {
            return res.status(400).json({
                success: false,
                msg: 'You do not have permissions to enabled'
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