import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './db/schema.js';
import { AuthService } from './services/authService.js';
import { ProductService } from './services/productService.js';
import { authMiddleware, adminOnly, AuthRequest } from './middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db/schema.js';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase();

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ PRODUCT ROUTES ============

// GET all products with filters
app.get('/api/products', (req: Request, res: Response) => {
  const { style, minPrice, maxPrice, search } = req.query;
  const filters = {
    style: style as string | undefined,
    minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
    search: search as string | undefined,
  };
  const products = ProductService.getAll(filters);
  res.json({ success: true, data: products });
});

// GET single product
app.get('/api/products/:id', (req: Request, res: Response) => {
  const product = ProductService.getById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }
  res.json({ success: true, data: product });
});

// POST create product (admin only)
app.post('/api/products', authMiddleware, adminOnly, (req: AuthRequest, res: Response) => {
  try {
    const { name, description, price, style, sizes, image_url, stock } = req.body;

    if (!name || !price || !style || !sizes) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const product = ProductService.create({
      name,
      description,
      price,
      style,
      sizes: typeof sizes === 'string' ? sizes : JSON.stringify(sizes),
      image_url,
      stock: stock || 10,
    });

    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// PUT update product (admin only)
app.put('/api/products/:id', authMiddleware, adminOnly, (req: AuthRequest, res: Response) => {
  try {
    const product = ProductService.update(req.params.id, req.body);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// DELETE product (admin only)
app.delete('/api/products/:id', authMiddleware, adminOnly, (req: AuthRequest, res: Response) => {
  const deleted = ProductService.delete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }
  res.json({ success: true, message: 'Product deleted' });
});

// ============ AUTH ROUTES ============

// POST register
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    if (!AuthService.validateEmail(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email' });
    }

    const validation = AuthService.validatePassword(password);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.errors.join(', ') });
    }

    // Check if user exists
    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ success: false, error: 'User already exists' });
    }

    const userId = `user_${uuidv4()}`;
    const passwordHash = AuthService.hashPassword(password);

    db.prepare('INSERT INTO users (id, email, password_hash, is_admin) VALUES (?, ?, ?, ?)').run(
      userId,
      email,
      passwordHash,
      0
    );

    const token = AuthService.generateToken(userId, email, false);
    res.status(201).json({ success: true, data: { userId, email, token } });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// POST login
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user || !AuthService.verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = AuthService.generateToken(user.id, user.email, user.is_admin);
    res.json({ success: true, data: { userId: user.id, email: user.email, isAdmin: user.is_admin, token } });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// GET current user (requires auth)
app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT id, email, is_admin FROM users WHERE id = ?').get(req.user?.userId) as any;
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  res.json({ success: true, data: { userId: user.id, email: user.email, isAdmin: user.is_admin } });
});

// POST refresh token
app.post('/api/auth/refresh', (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Token required' });
    }

    const decoded = AuthService.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const newToken = AuthService.generateToken(decoded.userId, decoded.email, decoded.isAdmin);
    res.json({ success: true, data: { token: newToken } });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

export default app;