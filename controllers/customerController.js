const supabase = require('../services/supabaseClient');

// Utility function to calculate days stored and bill amount
const calculateBill = (createdAt, ratePerDay, quantity) => {
  const now = new Date();
  const createdDate = new Date(createdAt);
  const daysStored = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24)); // Use floor for elapsed full days
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
  try {
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

    // New customers start with 0 days and 0 bill
    const daysStored = 0;
    const billAmount = 0;

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
      ])
      .select();

    if (error) throw error;
    return res.status(201).json(data ? data[0] : null);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Remove a customer by ID (move to history first)
const removeCustomer = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Customer ID required' });

  try {
    // 1. Get the customer record
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchError || !customer) throw new Error('Customer not found');

    // 2. Insert into history table (explicitly map fields)
    const { error: insertError } = await supabase
      .from('history')
      .insert([
        {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          grain_type: customer.grain_type,
          room_number: customer.room_number,
          quantity: customer.quantity,
          days_stored: customer.days_stored,
          bill_amount: customer.bill_amount,
          created_at: customer.created_at,
          removed_at: new Date().toISOString(),
        },
      ]);
    if (insertError) throw new Error(`Failed to archive customer: ${insertError.message}`);

    // 3. Delete from customers table
    const { error: deleteError } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);
    if (deleteError) throw new Error(deleteError.message);

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Update days_stored and bill_amount for all customers
const updateDaysAndBill = async (req, res) => {
  const ratePerDay = 10; // Example rate per day

  try {
    // Fetch all customers
    const { data: customers, error: fetchError } = await supabase
      .from('customers')
      .select('*');

    if (fetchError) throw fetchError;

    // Update each customer
    for (const customer of customers) {
      const { daysStored, billAmount } = calculateBill(customer.created_at, ratePerDay, customer.quantity);

      const { error } = await supabase
        .from('customers')
        .update({ days_stored: daysStored, bill_amount: billAmount })
        .eq('id', customer.id);

      if (error) throw new Error(`Failed to update customer ${customer.id}: ${error.message}`);
    }

    return res.json({ success: true, message: 'All records updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getCustomers,
  addCustomer,
  removeCustomer,
  updateDaysAndBill,
};
