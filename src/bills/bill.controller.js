import Bill from "./bill.model.js";
import Cart from "../cart/cart.model.js";
import User from "../users/user.model.js";

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
        res.status(500).json({
            success: false, msg:
            "Error generating bill",
            error
        });
    }
};

export const getBillUserById = async (req, res) => {
    try {
        const { id } = req.params;
        
        //verifica que el usuario ingresado sea el mismo que el usuario que va a buscar sus facturas
        const user = await User.findById(id);
        if (req.user.id !== user._id.toString()) {
            return res.status(400).json({
                success: false,
                msg: "You do not have permission to search a bill for another user"
            });
        }

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
            bills
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            msg: "Error retrieving bills",
            error
        });
    }
};