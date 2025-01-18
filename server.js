const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();  // Load environment variables

const app = express();
const port = 5000;

// Access JWT_SECRET from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// Set up the database connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'user_management',
  password: 'prushti', // Update this with your password
  port: 5432,
});

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Register a new user
app.post('/register', async (req, res) => {
  const { name, email, password, age } = req.body;

  // Input validation
  if (!name || !email || !password || !age) {
    return res.status(400).json({ message: 'Please fill in all fields.' });
  }

  try {
    // Check if user already exists
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into database
    const result = await pool.query(
      'INSERT INTO users (name, email, password, age) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, hashedPassword, age]
    );

    // Generate JWT token
    const token = jwt.sign({ id: result.rows[0].id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Error registering user', error: err.message });
  }
});

// Login user
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Please fill in both email and password.' });
  }

  try {
    // Find user by email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in user', error: err.message });
  }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Bearer token format
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Get all users (protected route)
app.get('/users', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, age FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
});

// Add a new user (protected route)
app.post('/users', verifyToken, async (req, res) => {
  const { name, email, age } = req.body;

  // Input validation
  if (!name || !email || !age) {
    return res.status(400).json({ message: 'Please fill in all fields' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO users (name, email, age) VALUES ($1, $2, $3) RETURNING *',
      [name, email, age]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error adding user', error: err.message });
  }
});

// Update a user (protected route)
app.put('/users/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, email, age } = req.body;

  // Input validation
  if (!name || !email || !age) {
    return res.status(400).json({ message: 'Please fill in all fields' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2, age = $3 WHERE id = $4 RETURNING *',
      [name, email, age, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error updating user', error: err.message });
  }
});

// Delete a user (protected route)
app.delete('/users/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user', error: err.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
