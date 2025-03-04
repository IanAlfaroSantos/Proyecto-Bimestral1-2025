import Cart from "./cart.model.js";
import Product from "../products/product.model.js";
import User from "../users/user.model.js"

export const addCart = async (req, res) => {
    try {
        const data = req.body;
        const user = await User.findOne({ username: String(data.username).toLowerCase() });

        if (!user) {
            return res.status(400).json({
                success: false,
                msg: "User not found"
            });
        }

        if (req.user.id !== user._id.toString()) {
            return res.status(400).json({
                success: false,
                msg: "You do not have permission to add products to someone else's cart"
            });
        }

        const products = [];
        for (let i = 0; i < data.nameProduct.length; i++) {
            const product = await Product.findOne({ nameProduct: String(data.nameProduct[i]).toLowerCase() });

            if (!product) {
                return res.status(400).json({
                    success: false,
                    msg: `Product ${data.nameProduct[i]} not found`
                });
            }
            
            if (product.stock < data.amount[i]) {
                return res.status(400).json({
                    success: false,
                    msg: `There are not enough quantities for ${data.nameProduct[i]}. Available: ${product.stock}`
                });
            }

            products.push({
                product: product._id,
                amount: data.amount[i]
            });
        }

        let cart = await Cart.findOne({ user: user._id });

        if (!cart) {
            cart = new Cart({
                user: user._id,
                products: products
            });
        } else {
            for (let i = 0; i < products.length; i++) {
                const productCart = cart.products.find(
                    (item) => item.product.toString() === products[i].product.toString()
                );
        
                if (productCart) {
                    productCart.amount += products[i].amount;
                } else {
                    cart.products.push(products[i]);
                }
            }
        }

        for (let i = 0; i < products.length; i++) {
            const product = await Product.findById(products[i].product);
            product.stock -= products[i].amount;
            await product.save();
        }

        await cart.save();

        const detailsCart = await Cart.findById(cart._id)
            .populate('user', 'username')
            .populate({
                path: 'products.product',
                select: 'nameProduct price',
                populate: {
                    path: 'category',
                    select: 'name'
                }
            });

        res.status(200).json({
            success: true,
            msg: "Product(s) added to cart successfully",
            detailsCart
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            msg: "Error adding cart",
            error
        });
    }
};