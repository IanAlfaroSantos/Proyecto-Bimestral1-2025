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
                msg: "You do not have permission to add products to someone else's cart"
            });
        }

        //verifica que el carrito no este vacio
        if (!cart) {
            return res.status(400).json({
                success: false,
                msg: "Cart not found"
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
        console.error(error);
        res.status(500).json({
            success: false, msg:
            "Error generating bill",
            error
        });
    }
};
