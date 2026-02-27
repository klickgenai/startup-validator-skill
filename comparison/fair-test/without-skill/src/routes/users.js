const express = require('express');
const bcrypt = require('bcryptjs');
const { getDatabase } = require('../db/database');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/users/signup - Register a new user
router.post('/signup', (req, res) => {
  const { email, password, name } = req.body;

  // Validate required fields
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Validate password length
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  const db = getDatabase();

  // Check if user already exists
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existingUser) {
    return res.status(409).json({ error: 'A user with this email already exists' });
  }

  // Hash password and create user
  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (email, password, name) VALUES (?, ?, ?)'
  ).run(email, hashedPassword, name);

  const token = generateToken(result.lastInsertRowid);

  res.status(201).json({
    message: 'User created successfully',
    user: {
      id: result.lastInsertRowid,
      email,
      name
    },
    token
  });
});

// POST /api/users/login - Authenticate a user
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = getDatabase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const isValidPassword = bcrypt.compareSync(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = generateToken(user.id);

  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    },
    token
  });
});

module.exports = router;
