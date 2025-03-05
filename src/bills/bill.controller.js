import Bill from "./bill.model.js";
import Cart from "../cart/cart.model.js";
import User from "../users/user.model.js";
import { request, response } from "express";

export const generateBill = async (req, res) => {
    try {
        const { id } = req.params;

        const cart = await Cart.findOne({ user: id }).populate('products.product');
      
        //verifica que el usuario ingresado sea el mismo que el usuario que va a agregar
        const user = await User.findById(id);
        if (req.user.id !== user._id.toString()) {
            return res.status(400).json({
                success: false,
                msg: "You do not have permission to generate a bill for another user"
            });
        }
        
        //verifica que el carrito exista en la base de datos
        if (!cart) {
            return res.status(400).json({
                success: false,
                msg: "Cart not found"
            });
        }

    if (cart.products.length === 0) {
        return res.status(400).json({
            success: false,
            msg: "Cart is empty"
        });
    }
  
        let total = 0;
        const products = [];
        for (let i = 0; i < cart.products.length; i++) {
            total += cart.products[i].product.price * cart.products[i].amount;

            products.push({
                product: cart.products[i].product._id,
                amount: cart.products[i].amount
            });
        }
        
        const bill = new Bill({
            user: id,
            products: products,
            total: total
        });
        
        await bill.save();

        cart.products = [];
        await cart.save();
        
        const detailsBill = await Bill.findById(bill._id)
        .populate('user', 'username')
        .populate({
            path: 'products.product',
            select: 'nameProduct price'
        });
        
        res.status(200).json({
            success: true,
            msg: "Bill generated successfully",
            detailsBill
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false, msg:
            "Error generating bill",
            error
        });
    }
};

export const getBillUserById = async (req, res) => {
    try {
        const { id } = req.params;
        
        //verifica que el usuario ingresado sea el mismo que el usuario que va a buscar sus facturas (admins tambien pueden hacerlo)
        const user = await User.findById(id);
        if (req.user.id !== user._id.toString() && req.user.role !== "ADMIN") {
            return res.status(400).json({
                success: false,
                msg: "You do not have permission to search a bill for another user"
            });
        }

        
        const total = await Bill.countDocuments({ user: id });
        const bills = await Bill.find({ user: id })
        .populate('user', 'username')
        .populate({
            path: 'products.product',
            select: 'nameProduct price'
        });
        
        //verifica que la factura exista en la base de datos
        if (!bills) {
            return res.status(404).json({
                success: false,
                msg: "No bills found for this user"
            });
        }

        //verifica que la lista de facturas no este vacía
        if (bills.length === 0) {
            return res.status(200).json({
                success: true,
                msg: "No bills found for this user"
            });
        }

        res.status(200).json({
            success: true,
            total,
            bills
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: "Error retrieving bills",
            error
        });
    }
};

export const updateBill = async (req, res = response) => {
    try {
        const { id } = req.params;
        const { nameProduct, amount } = req.body;

        //verifica que solo los admin puedan editar
        if (req.user.role !== 'ADMIN') {
            return res.status(400).json({
                success: false,
                msg: "You do not have permission to edit this bill"
            });
        }

        //verifica que la factura exista en la base de datos
        const bill = await Bill.findById(id).populate('products.product');
        if (!bill) {
            return res.status(400).json({
                success: false,
                msg: "Bill not found"
            });
        }

        let total = 0;
        
        for (let i = 0; i < nameProduct.length; i++) {
            const productName = nameProduct[i];
            const productAmount = amount[i];

            const product = bill.products.find(item => item.product.nameProduct.toLowerCase() === productName.toLowerCase());

            //verficar que el producta si exista en la factura
            if (!product) {
                return res.status(400).json({
                    success: false,
                    msg: `Product "${productName}" not found in this bill`
                });
            }

            const previousAmount = product.amount;
            const changeStock = productAmount - previousAmount;

            product.product.stock -= changeStock;
            await product.product.save();

            product.amount = productAmount;

            total += product.product.price * productAmount;
        }

        bill.total = total;

        const updatedBill = await Bill.findByIdAndUpdate(id, { products: bill.products, total: bill.total }, { new: true });

        res.status(200).json({
            success: true,
            msg: "Bill updated successfully",
            updatedBill
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: "Error updating bill",
            error
        });
    }
};

export const getBillById = async (req, res) => {
    try {

        const { id } = req.params;

        //verifica que solo los admin puedan buscar las facturas por ID
        if (req.user.role !== "ADMIN") {
            return res.status(400).json({
                success: false,
                msg: "You do not have permission to view this bill"
            });
        }

        //verifica que la factura exista en la base de datos
        const bill = await Bill.findById(id).populate('products.product');
        if (!bill) {
            return res.status(404).json({
                success: false,
                msg: "Bill not found"
            });
        }

        res.status(200).json({
            success: true,
            bill
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: "Error retrieving bill",
            error
        });
    }
}