import { Schema, model } from "mongoose";

const CartSchema = Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: [true, "The user is required"]
    },
    products: [{
        _id: false,
        product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "The product is required"]
        },
        amount: {
            type: Number,
            required: [true, "The amount is required"]
        }
    }]
}, {
    timestamps: true,
    versionKey: false
})

export default model("Cart", CartSchema);