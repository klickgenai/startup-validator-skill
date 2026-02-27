const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const db = new Database('tasks.db');
const JWT_SECRET = 'your-secret-key';

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    due_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Auth middleware
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Register
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    const result = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run(username, email, hashedPassword);
    const token = jwt.sign({ userId: result.lastInsertRowid }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ message: 'User created', token, userId: result.lastInsertRowid });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ message: 'Login successful', token, userId: user.id });
});

// Get all tasks for the logged-in user
app.get('/api/tasks', authenticate, (req, res) => {
  const { status, priority } = req.query;
  let query = 'SELECT * FROM tasks WHERE user_id = ?';
  const params = [req.userId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (priority) {
    query += ' AND priority = ?';
    params.push(priority);
  }

  query += ' ORDER BY created_at DESC';

  const tasks = db.prepare(query).all(...params);
  res.json(tasks);
});

// Get a single task
app.get('/api/tasks/:id', authenticate, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
});

// Create a task
app.post('/api/tasks', authenticate, (req, res) => {
  const { title, description, status, priority, due_date } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const validStatuses = ['todo', 'in_progress', 'done'];
  const validPriorities = ['low', 'medium', 'high'];

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be: todo, in_progress, or done' });
  }
  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority. Must be: low, medium, or high' });
  }

  const result = db.prepare(
    'INSERT INTO tasks (user_id, title, description, status, priority, due_date) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.userId, title, description || null, status || 'todo', priority || 'medium', due_date || null);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(task);
});

// Update a task
app.put('/api/tasks/:id', authenticate, (req, res) => {
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!existing) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const { title, description, status, priority, due_date } = req.body;

  const validStatuses = ['todo', 'in_progress', 'done'];
  const validPriorities = ['low', 'medium', 'high'];

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority' });
  }

  db.prepare(
    'UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?'
  ).run(
    title || existing.title,
    description !== undefined ? description : existing.description,
    status || existing.status,
    priority || existing.priority,
    due_date !== undefined ? due_date : existing.due_date,
    req.params.id,
    req.userId
  );

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  res.json(task);
});

// Delete a task
app.delete('/api/tasks/:id', authenticate, (req, res) => {
  const result = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json({ message: 'Task deleted' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
