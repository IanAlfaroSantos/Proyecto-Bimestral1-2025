import { Schema, model } from "mongoose"

const UserSchema = Schema({
    name: {
        type: String,
        required: [true, "The name is required"],
        maxlength: [25, "The name is more than 25 characters"]
    },
    surname: {
        type: String,
        required: [true, "The surname is required"],
        maxlength: [25, "The surname is more than 25 characters"]
    },
    username: {
        type: String,
        unique: true,
        lowercase: true
    },
    email: {
        type: String,
        required: [true, "The email is required"],
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, "The password is required"],
        minlength: [8, "The password must be at least 8 characters long"],
    },
    phone: {
        type: String,
        required: [true, "The phone number is required"],
        maxlength: [8, "The phone number is more than 8 characters"],
        minlength: [8, "The phone number must be at least 8 characters long"]
    },
    role: {
        type: String,
        enum: ["ADMIN", "CLIENT"],
        default: "CLIENT"
    },
    estado: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    versionKey: false
})

UserSchema.methods.toJSON = function () {
    const { __v, password, _id, ...user } = this.toObject()
    user.uid = _id
    return user
}

export default model("User", UserSchema);