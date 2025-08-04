// controllers/authController.js
const fs = require('fs');
const path = require('path');

const adminsFilePath = path.join(__dirname, '..', 'data', 'admins.json');

exports.loginAdmin = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' });

  const admins = JSON.parse(fs.readFileSync(adminsFilePath, 'utf8'));

  const admin = admins.find(
    (user) => user.email === email && user.password === password
  );

  if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

  return res.status(200).json({ message: 'Login successful', role: 'admin' });
};
