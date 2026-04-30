const express = require('express');
const { Pool } = require('pg');
const morgan = require('morgan');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan('combined'));

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'cruddb',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Wait for DB with retry logic
const connectWithRetry = async (retries = 10, delay = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      console.log('✅ Connected to PostgreSQL');
      client.release();
      return;
    } catch (err) {
      console.log(`⏳ DB not ready, retrying (${i + 1}/${retries})...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  console.error('❌ Could not connect to DB after retries');
  process.exit(1);
};

// ─── ROUTES ──────────────────────────────────────────────────────────────────

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', service: 'crud-api', db: 'connected', timestamp: new Date() });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

// Root
app.get('/', (req, res) => {
  res.json({
    message: '📦 CRUD REST API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      items: {
        getAll: 'GET /api/items?page=1&limit=10',
        getOne: 'GET /api/items/:id',
        create: 'POST /api/items',
        update: 'PUT /api/items/:id',
        delete: 'DELETE /api/items/:id',
      },
      users: {
        getAll: 'GET /api/users?page=1&limit=10',
        getOne: 'GET /api/users/:id',
        create: 'POST /api/users',
        update: 'PUT /api/users/:id',
        delete: 'DELETE /api/users/:id',
      },
    },
  });
});

// ─── ITEMS CRUD ───────────────────────────────────────────────────────────────

// GET all items — with pagination
app.get('/api/items', async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { rows } = await pool.query(
      'SELECT * FROM items ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    const countResult = await pool.query('SELECT COUNT(*) FROM items');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single item
app.get('/api/items/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM items WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Item not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// CREATE item
app.post('/api/items', async (req, res) => {
  const { name, description, price, quantity } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'name is required' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO items (name, description, price, quantity) VALUES ($1,$2,$3,$4) RETURNING *',
      [name, description || null, price || 0, quantity || 0]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE item
app.put('/api/items/:id', async (req, res) => {
  const { name, description, price, quantity } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE items SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        price = COALESCE($3, price),
        quantity = COALESCE($4, quantity),
        updated_at = NOW()
      WHERE id = $5 RETURNING *`,
      [name, description, price, quantity, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Item not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE item
app.delete('/api/items/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM items WHERE id = $1 RETURNING *', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Item not found' });
    res.json({ success: true, message: 'Item deleted', data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── USERS CRUD ───────────────────────────────────────────────────────────────

// GET all users — with pagination
app.get('/api/users', async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { rows } = await pool.query(
      'SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    const countResult = await pool.query('SELECT COUNT(*) FROM users');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single user
app.get('/api/users/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// CREATE user
app.post('/api/users', async (req, res) => {
  const { name, email, role } = req.body;
  if (!name || !email) return res.status(400).json({ success: false, error: 'name and email are required' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, role) VALUES ($1,$2,$3) RETURNING id, name, email, role, created_at',
      [name, email, role || 'user']
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ success: false, error: 'Email already exists' });
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE user
app.put('/api/users/:id', async (req, res) => {
  const { name, email, role } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        role = COALESCE($3, role),
        updated_at = NOW()
      WHERE id = $4 RETURNING id, name, email, role, updated_at`,
      [name, email, role, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ success: false, error: 'Email already exists' });
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id, name, email', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, message: 'User deleted', data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` });
});

// Start
connectWithRetry().then(() => {
  app.listen(PORT, () => console.log(`🚀 API running on port ${PORT}`));
});
