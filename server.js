const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// ---------------------- INITIALIZE APP ---------------------- //
const app = express();
app.use(express.json());
app.use(cors());

// Serve static files from the public directory
app.use(express.static('public'));

// ---------------------- MONGODB CONNECTION ---------------------- //
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error Connecting:", err));

// ---------------------- SCHEMAS & MODELS ---------------------- //
const foodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  pickupLocation: { type: String, required: true },
  expiryTime: { type: Date, required: true },
  claimedBy: { type: String, default: null }, // receiver info
  createdAt: { type: Date, default: Date.now }
});

const Food = mongoose.model("Food", foodSchema);

// Small test schema (for /test-insert)
const Test = mongoose.model(
  "Test",
  new mongoose.Schema({
    name: String,
    time: Date
  })
);

// ---------------------- ROUTES ---------------------- //

// Root check
app.get("/", (req, res) => {
  res.send("🍽 Food Sharing Backend is running...");
});

//  Add new food (donor)
app.post("/food", async (req, res) => {
  try {
    const { name, category, quantity, pickupLocation, expiryTime } = req.body;
    const food = new Food({ name, category, quantity, pickupLocation, expiryTime });
    await food.save();
    res.status(201).json({ message: "Food added successfully", food });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//  Get available food (hide expired automatically)
app.get("/food", async (req, res) => {
  try {
    const now = new Date();
    const foods = await Food.find({
      expiryTime: { $gt: now },
      claimedBy: null
    });
    res.json(foods);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//  Claim food (receiver takes it)
app.post("/food/:id/claim", async (req, res) => {
  try {
    const { receiverName } = req.body;
    const food = await Food.findOneAndUpdate(
      { _id: req.params.id, claimedBy: null },
      { $set: { claimedBy: receiverName } },
      { new: true }
    );
    if (!food) return res.status(404).json({ message: "Food not available" });
    res.json({ message: "Food claimed successfully", food });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//  Dashboard stats
app.get("/dashboard", async (req, res) => {
  try {
    const totalFood = await Food.countDocuments();
    const savedFood = await Food.countDocuments({ claimedBy: { $ne: null } });

    res.json({
      totalFood,
      savedFood,
      peopleFed: savedFood, // simple 1 food = 1 person assumption
      waterSaved: savedFood * 100 // arbitrary metric
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------- TEST ROUTE ---------------------- //
app.get("/test-insert", async (req, res) => {
  try {
    const doc = new Test({ name: "Aritro", time: new Date() });
    await doc.save();
    res.send(`Inserted with ID: ${doc._id}`);
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
});

// ---------------------- SERVER ---------------------- //
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));
