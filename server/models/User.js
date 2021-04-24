"use strict";
exports.__esModule = true;
var mongoose_1 = require("mongoose");
var UserSchema = new mongoose_1.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String
    },
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    company: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Company"
    },
    roles: [
        {
            type: String
        },
    ]
}, { timestamps: true });
var UserModel = mongoose_1.model("User", UserSchema);
exports["default"] = UserModel;
