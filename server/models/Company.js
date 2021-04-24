"use strict";
exports.__esModule = true;
var mongoose_1 = require("mongoose");
var CompanySchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true
    },
    details: {
        type: String
    },
    email: {
        type: String,
        required: true
    }
}, { timestamps: true });
var CompanyModel = mongoose_1.model("Company", CompanySchema);
exports["default"] = CompanyModel;
