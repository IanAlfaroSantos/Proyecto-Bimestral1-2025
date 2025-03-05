import Cart from "./cart.model.js";
import Product from "../products/product.model.js";
import User from "../users/user.model.js"

export const addCart = async (req, res) => {
    try {
        const data = req.body;
        const user = await User.findOne({ username: String(data.username).toLowerCase() });

        //por si ingresan un usuario que no existe en la base de datos
        if (!user) {
            return res.status(400).json({
                success: false,
                msg: "User not found"
            });
        }

        //verifica que el usuario ingresado sea el mismo que el usuario que va a agregar
        if (req.user.id !== user._id.toString()) {
            return res.status(400).json({
                success: false,
                msg: "You do not have permission to add products to someone else's cart"
            });
        }

        const products = [];
        for (let i = 0; i < data.nameProduct.length; i++) {
            const product = await Product.findOne({ nameProduct: String(data.nameProduct[i]).toLowerCase() });

            //verifica que el o los productos ingresados si existan en la base de datos
            if (!product) {
                return res.status(400).json({
                    success: false,
                    msg: `Product ${data.nameProduct[i]} not found`
                });
            }
            
            //verifica que el stock del producto sea suficiente para agregarlo al carrito
            if (product.stock < data.amount[i]) {
                return res.status(400).json({
                    success: false,
                    msg: `There are not enough quantities for ${data.nameProduct[i]}. Available: ${product.stock}`
                });
            }

            products.push({
                product: product._id,
                nameProduct: product.nameProduct,
                price: product.price,
                amount: data.amount[i]
            });
        }

        //busca el carrito del usuario en la base de datos, si no lo encuentra, lo crea
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
        
                //verifica que si ya existe el producto solo se sume la cantidad con la cantidad nueva, si no crea otro producto en el arreglo
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
                select: 'nameProduct price'
            });

        res.status(200).json({
            success: true,
            msg: "Products added to cart successfully",
            detailsCart
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: "Error adding cart",
            error
        });
    }
};