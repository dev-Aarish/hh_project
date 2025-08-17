// models/Food.js
const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    donorName: { type: String, required: true },
    category: { type: String, required: true },           // e.g., "Baked", "Veg", "Fruit"
    quantity: { type: Number, required: true, min: 1 },   // number of portions/items
    pickupLocation: { type: String, required: true },     // address or area
    expiryTime: { type: Date, required: true },           // hide after this
    photoUrl: { type: String },                            // optional for proof
    claimedBy: { type: String, default: null }            // receiver name or id
  },
  { timestamps: true }
);

module.exports = mongoose.model("Food", foodSchema);