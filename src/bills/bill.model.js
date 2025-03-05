import { Schema, model } from "mongoose";

const BillSchema = Schema({
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
            required: [true, "The amount is required"],
            min: [1, "The amount must be at least 1"]
        }
    }],
    total: {
        type: Number,
        required: [true, "The total is required"],
        min: [0, "The total be cannot to negative"]
    }
}, {
    timestamps: true,
    versionKey: false
})

export default model("Bill", BillSchema);