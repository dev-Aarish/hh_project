import express from "express";
import cors from "cors";
import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";



const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrbmdpcGxwZmlwdnNwYW1wd3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MTYyNDAsImV4cCI6MjA3MTI5MjI0MH0.UY9952vOwz3HkRLYpfW8wnvkhtQECslCFGSMqbrsH7E";
const JWT_SECRET = process.env.JWT_SECRET;

const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use(express.static("public"));

// Middleware to authenticate Supabase JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, error: "Access token missing" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(403)
        .json({ success: false, error: "Invalid or expired token" });
    }
    req.userId = decoded.sub; // 'sub' claim contains user ID
    next();
  });
}

// GET /donations - fetch available donations
app.get("/donations", async (req, res) => {
  try {
    const { data: donations, error } = await supabase
      .from("donations")
      .select(
        `
        id,
        title,
        description,
        expiry_time,
        donor_id,
        category,
        quantity,
        unit,
        status,
        created_at
      `,
      )
      .eq("status", "available")
      .gt("expiry_time", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, data: donations, count: donations?.length || 0 });
  } catch (error) {
    console.error("Error fetching donations:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch donations",
      message: error.message,
    });
  }
});

// POST /donations - add a new donation (protected)
app.post("/donations", authenticateToken, async (req, res) => {
  const { title, description, expiry_time, category, quantity, unit } =
    req.body;
  const donor_id = req.userId; // Taken from JWT token, ignore client-supplied donor_id

  if (!title || !donor_id || !expiry_time) {
    return res.status(400).json({
      success: false,
      error: "title, donor_id, and expiry_time are required",
    });
  }

  try {
    const { data, error } = await supabase
      .from("donations")
      .insert([
        {
          title,
          description,
          expiry_time,
          donor_id,
          category,
          quantity,
          unit,
          status: "available",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to create donation",
        message: error.message,
      });
    }

    res.status(201).json({
      success: true,
      data,
      message: "Donation created successfully",
    });
  } catch (error) {
    console.error("Error creating donation:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /donations/:id/claim - claim a donation (protected)
app.post("/donations/:id/claim", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const claimer_id = req.userId; // Taken from JWT token
  const { requested_quantity, message } = req.body;

  if (!claimer_id) {
    return res
      .status(400)
      .json({ success: false, error: "Claimer ID required" });
  }

  try {
    // 1. Check donation exists and status
    const { data: donation, error: donationError } = await supabase
      .from("donations")
      .select("*")
      .eq("id", id)
      .single();

    if (donationError || !donation) {
      return res
        .status(404)
        .json({ success: false, error: "Donation not found" });
    }

    if (donation.status !== "available") {
      return res
        .status(400)
        .json({ success: false, error: "Donation no longer available" });
    }

    // 2. Check claimer user exists
    const { data: claimer, error: claimerError } = await supabase
      .from("users") // ensure your users table name matches
      .select("*")
      .eq("id", claimer_id)
      .single();

    if (claimerError || !claimer) {
      return res
        .status(400)
        .json({ success: false, error: "Claimer not found" });
    }

    // 3. Check if already claimed by this user
    const { data: existingClaim } = await supabase
      .from("claims")
      .select("*")
      .eq("listingId", id)
      .eq("recipientId", claimer_id)
      .maybeSingle();

    if (existingClaim) {
      return res
        .status(400)
        .json({ success: false, error: "Already claimed this donation" });
    }

    // 4. Create the claim record
    const { data: newClaim, error: claimError } = await supabase
      .from("claims")
      .insert([
        {
          listingId: id,
          recipientId: claimer_id,
          requestedQuantity: requested_quantity || donation.quantity,
          message: message || null,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (claimError) {
      return res
        .status(500)
        .json({ success: false, error: claimError.message });
    }

    res.status(201).json({
      success: true,
      data: newClaim,
      message: "Claim created successfully",
    });
  } catch (error) {
    console.error("Error creating claim:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check route
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Food Donation API is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health: http://localhost:${PORT}/health`);
});




