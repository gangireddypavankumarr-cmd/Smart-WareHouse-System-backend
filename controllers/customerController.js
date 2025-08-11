const supabase = require('../services/supabaseClient');

// Utility function to calculate days stored and bill amount
const calculateBill = (createdAt, ratePerDay, quantity) => {
  const now = new Date();
  const createdDate = new Date(createdAt);
  const daysStored = Math.ceil((now - createdDate) / (1000 * 60 * 60 * 24));
  const billAmount = daysStored * ratePerDay * quantity;
  return { daysStored, billAmount };
};

// Get all customers
const getCustomers = async (req, res) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
};

// Add a new customer
const addCustomer = async (req, res) => {
  const {
    id,
    name,
    phone,
    email,
    grain_type,
    room_number,
    quantity,
  } = req.body;

  const ratePerDay = 10; // Example rate per day
  const createdAt = new Date().toISOString();
  const { daysStored, billAmount } = calculateBill(createdAt, ratePerDay, quantity);

  const { data, error } = await supabase
    .from('customers')
    .insert([
      {
        id,
        name,
        phone,
        email,
        grain_type,
        room_number,
        quantity,
        days_stored: daysStored,
        bill_amount: billAmount,
        created_at: createdAt,
      },
    ]);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(data ? data[0] : null);
};

// Remove a customer by ID (move to history first)
const removeCustomer = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Customer ID required' });
  // 1. Get the customer record
  const { data: customer, error: fetchError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();
  if (fetchError || !customer) return res.status(404).json({ error: 'Customer not found' });
  // 2. Insert into history table
  const { error: insertError } = await supabase
    .from('history')
    .insert([
      {
        ...customer,
        removed_at: new Date().toISOString(),
      },
    ]);
  if (insertError) return res.status(500).json({ error: 'Failed to archive customer: ' + insertError.message });
  // 3. Delete from customers table
  const { error: deleteError } = await supabase
    .from('customers')
    .delete()
    .eq('id', id);
  if (deleteError) return res.status(500).json({ error: deleteError.message });
  return res.json({ success: true });
};

module.exports = {
  getCustomers,
  addCustomer,
  removeCustomer,
};
