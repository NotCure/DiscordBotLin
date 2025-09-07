// Schemas/LicenseKeySchema.js
const {Schema, model} = require("mongoose");

let LicenseKeySchema = new Schema({
  // This "key" will now store the MachoAuthenticationKey
  key: { type: String, required: true, unique: true, index: true },

  // Bind to a player name (case-insensitive search via playerNameLower)
  playerName: { type: String, default: null },
  playerNameLower: { type: String, default: null, index: true },

  used: { type: Boolean, default: false, index: true },
  revoked: { type: Boolean, default: false, index: true },
  expiresAt: { type: Date, default: null, index: true },
  usedAt: { type: Date, default: null },
  lastCheckAt: { type: Date, default: null },
}, { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }, versionKey: false });

LicenseKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

LicenseKeySchema.pre('save', function(next){
  if (this.playerName) this.playerNameLower = this.playerName.toLowerCase();
  next();
});

module.exports = model("LicenseKey", LicenseKeySchema);
