import { Schema, model } from "mongoose";

const CategorySchema = Schema({
    name: {
        type: String,
        required: [true, "The name is required"],
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        required: [true, "The description is required"]
    },
    estado: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    versionKey: false
});

export default model("Category", CategorySchema);