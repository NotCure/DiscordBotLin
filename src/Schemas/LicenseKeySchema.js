const {Schema, model} = require("mongoose");

let LicenseKeySchema = new Schema({
    key: { type: String, required: true, unique: true, index: true },
    used: { type: Boolean, default: false, index: true },
    revoked: { type: Boolean, default: false, index: true },
    expiresAt: { type: Date, default: null, index: true },
    usedAt: { type: Date, default: null },
    lastCheckAt: { type: Date, default: null },


},
{ timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }, versionKey: false }
);
    
LicenseKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = model("LicenseKey", LicenseKeySchema);
