import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(bodyParser.json());
app.use(cors());

// === Supabase setup ===
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing Supabase environment variables in .env");
  process.exit(1);
}
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// === File upload (images) ===
const upload = multer({ dest: "uploads/" });

// === Middleware: Require auth ===
async function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Sign up to continue" });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: "Log in to continue" });
    }

    req.user = data.user;
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    res.status(500).json({ error: "Internal auth error" });
  }
}

// === User Signup ===
app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return res.status(400).json({
        code: 400,
        error_code: error.name || "signup_failed",
        msg: error.message,
      });
    }

    res.json({
      success: true,
      user: data.user,
      session: data.session,
    });
  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).json({ error: "Internal server error during signup" });
  }
});

// === User Login ===
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({
        code: 400,
        error_code: error.name || "invalid_credentials",
        msg: error.message,
      });
    }

    res.json({
      success: true,
      user: data.user,
      session: data.session,
      access_token: data.session?.access_token,
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Internal server error during login" });
  }
});

// === 1. Food Listings ===
app.post("/listings", requireAuth, upload.single("image"), async (req, res) => {
  try {
    const { title, quantity, quality, category, location, expires_at } = req.body;

    const { data, error } = await supabase
      .from("listings")
      .insert({
        donor_id: req.user.id,
        title,
        quantity,
        quality,
        category,
        location,
        expires_at,
      })
      .select();

    if (error) return res.status(500).json({ error: error.message });

    // Premium features
    const premium = await isPremium(req.user.id);
    let report = null;
    if (premium) {
      report = {
        analytics: {
          estimatedImpact: quantity * 2,
          csrReport: `This donation saves ${quantity} meals and supports SDG 12 (Responsible Consumption) & SDG 2 (Zero Hunger).`,
        },
      };
    }

    res.json({ listing: data, premiumReport: report });
  } catch (err) {
    console.error("Listing error:", err.message);
    res.status(500).json({ error: "Internal error while creating listing" });
  }
});

// === 2. Claim Food ===
app.patch("/listings/:id/claim", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("listings")
      .update({ status: "claimed", claimed_by: req.user.id })
      .eq("id", id)
      .eq("status", "active")
      .select();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, listing: data });
  } catch (err) {
    console.error("Claim error:", err.message);
    res.status(500).json({ error: "Internal error while claiming" });
  }
});

// === 3. Google Calendar Integration for Events ===
app.post("/events", requireAuth, async (req, res) => {
  try {
    const {
      summary,
      location,
      startDateTime,
      endDateTime,
      description,
      oauthToken,
      guestCount,
    } = req.body;

    if (!summary || !startDateTime || !endDateTime) {
      return res.status(400).json({ error: "Missing event details" });
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: oauthToken });
    const calendar = google.calendar({ version: "v3", auth });

    const event = {
      summary,
      location,
      description,
      start: { dateTime: startDateTime, timeZone: "Asia/Kolkata" },
      end: { dateTime: endDateTime, timeZone: "Asia/Kolkata" },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });

    // Predict surplus meals
    const predictedMeals = Math.round((guestCount || 200) * 0.25);

    await supabase.from("listings").insert({
      donor_id: req.user.id,
      title: `${summary} Surplus`,
      quantity: predictedMeals,
      quality: "Good",
      category: "cooked",
      location,
      expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    });

    res.json({
      success: true,
      eventId: response.data.id,
      predictedMeals,
    });
  } catch (err) {
    console.error("Event error:", err.message);
    res.status(500).json({ error: "Failed to create event" });
  }
});

// === 4. Delivery Charge Calculation ===
app.post("/delivery/quote", requireAuth, async (req, res) => {
  try {
    const { donorLat, donorLng, receiverLat, receiverLng } = req.body;
    if (!donorLat || !donorLng || !receiverLat || !receiverLng) {
      return res.status(400).json({ error: "Location coordinates required" });
    }

    function haversine(lat1, lon1, lat2, lon2) {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
          Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) ** 2;
      return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    }

    const distance = haversine(donorLat, donorLng, receiverLat, receiverLng);

    if (distance > 10) {
      return res.json({
        serviceable: false,
        message: "Location is not serviceable",
      });
    }

    let charge = 50;
    if (distance <= 5) charge = 20;
    else if (distance > 7) charge = 80;

    res.json({ serviceable: true, distance: distance.toFixed(2), charge });
  } catch (err) {
    console.error("Delivery error:", err.message);
    res.status(500).json({ error: "Error calculating delivery" });
  }
});

// === 5. Subscription System ===
async function isPremium(userId) {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();
    return !!data && !error;
  } catch (err) {
    console.error("Subscription check error:", err.message);
    return false;
  }
}

app.post("/subscribe", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from("subscriptions").insert({
      user_id: req.user.id,
      status: "active",
      started_at: new Date().toISOString(),
      expires_at: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
    });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, subscription: data });
  } catch (err) {
    console.error("Subscribe error:", err.message);
    res.status(500).json({ error: "Error creating subscription" });
  }
});

// === Health Check ===
app.get("/", (req, res) => {
  res.send("EcoWaste backend is running 🚀");
});

// === Start Server ===
app.listen(3000, () => {
  console.log("✅ EcoWaste backend running on http://localhost:3000");
});
