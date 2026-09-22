const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema(
    {
        maintenanceEnabled: {
            type: Boolean,
            default: false
        },

        maintenanceMessage: {
            type: String,
            default:
                "FINORA is currently undergoing scheduled maintenance. Please check back shortly.",
            trim: true,
            maxlength: 500
        }
    },

    {
        timestamps: true
    }
);

module.exports =
    mongoose.model(
        "SystemSettings",
        systemSettingsSchema
    );
