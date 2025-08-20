// ------------------------------
// Food Donation API (Express + Supabase)
// ------------------------------

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ------------------------------
// ROUTES
// ------------------------------

// GET /donations - fetch available donations
app.get('/donations', async (req, res) => {
  try {
    const { data: donations, error } = await supabase
      .from('donations')
      .select(`
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
      `)
      .eq('status', 'available')
      .gt('expiry_time', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, data: donations, count: donations?.length || 0 });
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch donations',
      message: error.message,
    });
  }
});

// POST /donations - add a new donation
app.post('/donations', async (req, res) => {
  const { title, description, expiry_time, donor_id, category, quantity, unit } = req.body;

  if (!title || !donor_id || !expiry_time) {
    return res.status(400).json({
      success: false,
      error: 'title, donor_id, and expiry_time are required',
    });
  }

  try {
    const { data, error } = await supabase
      .from('donations')
      .insert([{
        title,
        description,
        expiry_time,
        donor_id,
        category,
        quantity,
        unit,
        status: 'available',
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create donation',
        message: error.message,
      });
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Donation created successfully',
    });
  } catch (error) {
    console.error('Error creating donation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /donations/:id/claim - claim a donation
app.post('/donations/:id/claim', async (req, res) => {
  const { id } = req.params;
  const { claimer_id, requested_quantity, message } = req.body;

  if (!claimer_id) {
    return res.status(400).json({ success: false, error: 'claimer_id is required' });
  }

  try {
    // 1. Check donation
    const { data: donation, error: donationError } = await supabase
      .from('donations')
      .select('*')
      .eq('id', id)
      .single();

    if (donationError || !donation) {
      return res.status(404).json({ success: false, error: 'Donation not found' });
    }

    if (donation.status !== 'available') {
      return res.status(400).json({ success: false, error: 'Donation no longer available' });
    }

    // 2. Check claimer
    const { data: claimer, error: claimerError } = await supabase
      .from('users') // ⚠️ Make sure your table is called 'users'
      .select('*')
      .eq('id', claimer_id)
      .single();

    if (claimerError || !claimer) {
      return res.status(400).json({ success: false, error: 'Claimer not found' });
    }

    // 3. Check if already claimed
    const { data: existingClaim } = await supabase
      .from('claims')
      .select('*')
      .eq('listingId', id)
      .eq('recipientId', claimer_id)
      .maybeSingle();

    if (existingClaim) {
      return res.status(400).json({ success: false, error: 'Already claimed this donation' });
    }

    // 4. Create claim
    const { data: newClaim, error: claimError } = await supabase
      .from('claims')
      .insert([{
        listingId: id,
        recipientId: claimer_id,
        requestedQuantity: requested_quantity || donation.quantity,
        message: message || null,
        status: 'pending',
      }])
      .select()
      .single();

    if (claimError) {
      return res.status(500).json({ success: false, error: claimError.message });
    }

    res.status(201).json({ success: true, data: newClaim, message: 'Claim created successfully' });
  } catch (error) {
    console.error('Error creating claim:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Food Donation API is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health: http://localhost:${PORT}/health`);
});
